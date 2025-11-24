/**
 * Clearance Genie AI Worker
 *
 * This Cloudflare Worker provides AI-powered object detection
 * for the Clearance Genie heating compliance application.
 *
 * Uses OpenAI Vision API for accurate object detection.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      // Parse request body
      const requestData = await request.json();
      const { image, equipmentType, detectObjects, userMessage, transcription, transcriptionContext, knowledgeCategories } = requestData;

      // Handle transcription-only requests first
      if (transcription) {
        const knowledge = await fetchLatestKnowledge(env, knowledgeCategories || ['pricebook']);
        const transcriptionResult = await sanitizeTranscriptionWithAI(
          transcription,
          transcriptionContext,
          env,
          knowledge
        );

        return jsonResponse({
          success: true,
          mode: 'transcription',
          ...transcriptionResult
        });
      }

      // Validate inputs
      if (!image || !equipmentType || !detectObjects) {
        return jsonResponse({
          success: false,
          error: 'Missing required fields: image, equipmentType, or detectObjects',
          objects: []
        }, 400);
      }

      // Validate image size (limit to 5MB)
      if (image.length > 5 * 1024 * 1024) {
        return jsonResponse({
          success: false,
          error: 'Image too large. Maximum size is 5MB.',
          objects: []
        }, 400);
      }

      // Check for OpenAI API key
      if (!env.OPENAI_API_KEY) {
        return jsonResponse({
          success: false,
          error: 'OpenAI API key not configured',
          objects: []
        }, 500);
      }

      // Try OpenAI first, fallback to Claude if it fails or detects nothing
      let detectedObjects, creditCard, brick;
      let aiServiceUsed = 'openai'; // Track which AI service was used

      try {
        const result = await detectObjectsWithOpenAI(
          image,
          equipmentType,
          detectObjects,
          env.OPENAI_API_KEY,
          userMessage
        );
        detectedObjects = result.objects;
        creditCard = result.creditCard;
        brick = result.brick;

        // If OpenAI returned 0 objects and Claude is available, try Claude as fallback
        if ((!detectedObjects || detectedObjects.length === 0) && env.ANTHROPIC_API_KEY) {
          console.log('OpenAI detected 0 objects, trying Claude fallback');
          try {
            const claudeResult = await detectObjectsWithClaude(
              image,
              equipmentType,
              detectObjects,
              env.ANTHROPIC_API_KEY,
              userMessage
            );
            // Only use Claude results if it found something
            if (claudeResult.objects && claudeResult.objects.length > 0) {
              detectedObjects = claudeResult.objects;
              creditCard = claudeResult.creditCard;
              brick = claudeResult.brick;
              aiServiceUsed = 'claude';
              console.log(`Claude found ${claudeResult.objects.length} objects`);
            }
          } catch (claudeError) {
            console.log('Claude fallback also failed:', claudeError.message);
            // Keep OpenAI results (empty array) if Claude fails
          }
        }
      } catch (openaiError) {
        console.log('OpenAI failed, trying Claude fallback:', openaiError.message);

        // Fallback to Claude if available
        if (env.ANTHROPIC_API_KEY) {
          try {
            const result = await detectObjectsWithClaude(
              image,
              equipmentType,
              detectObjects,
              env.ANTHROPIC_API_KEY,
              userMessage
            );
            detectedObjects = result.objects;
            creditCard = result.creditCard;
            brick = result.brick;
            aiServiceUsed = 'claude';
          } catch (claudeError) {
            console.error('Both OpenAI and Claude failed:', { openaiError, claudeError });
            throw new Error('AI detection failed: Both OpenAI and Claude services are unavailable');
          }
        } else {
          throw openaiError; // Re-throw if no Claude key available
        }
      }

      // Build calibration response
      const calibration = {
        creditCardDetected: creditCard !== null,
        creditCardBounds: creditCard,
        brickDetected: brick !== null,
        brickBounds: brick,
        pixelsPerMM: null  // Will be calculated on frontend
      };

      // Return successful response
      return jsonResponse({
        success: true,
        objects: detectedObjects,
        calibration: calibration,
        aiServiceUsed: aiServiceUsed // Indicate which AI service was used
      });

    } catch (error) {
      console.error('Worker error:', error);

      return jsonResponse({
        success: false,
        error: error.message || 'Internal server error',
        objects: []
      }, 500);
    }
  }
};

// Sanity constraints used during AI transcription cleanup
const ALLOWED_PIPE_SIZES_MM = [8, 10, 15, 22, 28, 35];
const PREFERRED_PRICEBOOK_VERSION = 'November 2025';

/**
 * Detect objects using OpenAI Vision API (GPT-4 Vision)
 */
async function detectObjectsWithOpenAI(image, equipmentType, detectObjects, apiKey, userMessage = '') {
  // Build a detailed prompt for object detection AND credit card detection
  const objectList = detectObjects.join(', ');

  let prompt = `You are an expert computer vision system for heating compliance detection.`;

  // Add user message if provided
  if (userMessage && userMessage.trim()) {
    prompt += `\n\nUSER CONTEXT: ${userMessage.trim()}\nPlease take this context into account when analyzing the image. For example, if the user mentions items to be removed or ignored, adjust your detection accordingly.`;
  }

  prompt += `

TASK 1: Detect calibration objects for scale measurement
Look for the following objects in priority order:

A) CREDIT CARD (highest priority):
- Standard dimensions with aspect ratio of approximately 1.586:1 (85.6mm x 53.98mm)
- Rectangular shape with rounded corners
- Typically has visible text, numbers, or logos
- Can be any color or design

B) STANDARD BRICK (fallback if no card found):
- Standard UK/Imperial brick dimensions: 215mm x 102.5mm x 65mm
- Red, orange, or clay colored rectangular block
- Often has mortar between bricks
- Look for typical brick texture and appearance
- May be laid horizontally or vertically

TASK 2: Detect compliance objects
Analyze this image and identify ALL visible objects from this list: ${objectList}

For EACH object you detect, provide:
1. The exact object type from the list above
2. A confidence score (0.0 to 1.0)
3. Bounding box coordinates as percentages (x, y, width, height) where:
   - x: left edge position (0-100%)
   - y: top edge position (0-100%)
   - width: object width (0-100%)
   - height: object height (0-100%)

Important guidelines:
- Be thorough: detect ALL instances of the listed objects
- Windows: distinguish between "window" (fixed) and "opening_window" (can open)
- Vents: "air_vent" (passive) vs "fan_vent" (mechanical)
- Pipes: "soil_pipe" (large drainage) vs "downpipe" (rainwater)
- Only return objects from the provided list
- Provide accurate bounding boxes that tightly fit each object

Return ONLY a JSON object in this exact format:
{
  "creditCard": {
    "detected": true,
    "confidence": 0.95,
    "bounds": {"x": 10.0, "y": 80.0, "width": 15.0, "height": 9.5}
  },
  "brick": {
    "detected": true,
    "confidence": 0.90,
    "bounds": {"x": 20.0, "y": 30.0, "width": 18.0, "height": 8.5},
    "orientation": "horizontal"
  },
  "objects": [
    {
      "type": "opening_window",
      "confidence": 0.95,
      "bounds": {"x": 45.5, "y": 20.0, "width": 30.0, "height": 40.0}
    },
    {
      "type": "air_vent",
      "confidence": 0.88,
      "bounds": {"x": 15.0, "y": 60.0, "width": 15.0, "height": 15.0}
    }
  ]
}

If no credit card is detected, set "creditCard" to null.
If no brick is detected, set "brick" to null.
For brick orientation: "horizontal" if width > height, "vertical" if height > width.`;

  try {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // GPT-4 Omni with vision
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                  detail: 'high'  // High detail for better detection
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1  // Low temperature for consistent results
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Extract the JSON response from GPT
    const content = data.choices[0].message.content;

    // Parse the JSON array from the response
    // Handle cases where GPT wraps response in markdown code blocks
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const result = JSON.parse(jsonStr);

    // Extract credit card detection
    let creditCard = null;
    if (result.creditCard && result.creditCard.detected) {
      creditCard = {
        confidence: result.creditCard.confidence,
        bounds: {
          // Convert percentage to pixel coordinates (assuming 1000x1000 reference)
          x: Math.round(result.creditCard.bounds.x * 10),
          y: Math.round(result.creditCard.bounds.y * 10),
          width: Math.round(result.creditCard.bounds.width * 10),
          height: Math.round(result.creditCard.bounds.height * 10)
        }
      };
    }

    // Extract brick detection (fallback calibration)
    let brick = null;
    if (result.brick && result.brick.detected) {
      brick = {
        confidence: result.brick.confidence,
        orientation: result.brick.orientation || 'horizontal',
        bounds: {
          // Convert percentage to pixel coordinates (assuming 1000x1000 reference)
          x: Math.round(result.brick.bounds.x * 10),
          y: Math.round(result.brick.bounds.y * 10),
          width: Math.round(result.brick.bounds.width * 10),
          height: Math.round(result.brick.bounds.height * 10)
        }
      };
    }

    // Transform objects to our expected format
    // Note: We need to get actual image dimensions, but since we don't have them
    // in the worker, we'll assume a standard size and let the frontend scale
    const objects = (result.objects || []).map(det => ({
      type: det.type,
      label: det.type.toUpperCase().replace(/_/g, ' '),
      bounds: {
        // Convert percentage to pixel coordinates (assuming 1000x1000 reference)
        x: Math.round(det.bounds.x * 10),
        y: Math.round(det.bounds.y * 10),
        width: Math.round(det.bounds.width * 10),
        height: Math.round(det.bounds.height * 10)
      },
      confidence: det.confidence,
      enabled: true
    }));

    return { objects, creditCard, brick };

  } catch (error) {
    console.error('OpenAI detection error:', error);
    throw new Error(`Object detection failed: ${error.message}`);
  }
}

/**
 * Detect objects using Claude (Anthropic) Vision API - Fallback option
 */
async function detectObjectsWithClaude(image, equipmentType, detectObjects, apiKey, userMessage = '') {
  // Build the same prompt as OpenAI
  const objectList = detectObjects.join(', ');

  let prompt = `You are an expert computer vision system for heating compliance detection.`;

  // Add user message if provided
  if (userMessage && userMessage.trim()) {
    prompt += `\n\nUSER CONTEXT: ${userMessage.trim()}\nPlease take this context into account when analyzing the image. For example, if the user mentions items to be removed or ignored, adjust your detection accordingly.`;
  }

  prompt += `

TASK 1: Detect calibration objects for scale measurement
Look for the following objects in priority order:

A) CREDIT CARD (highest priority):
- Standard dimensions with aspect ratio of approximately 1.586:1 (85.6mm x 53.98mm)
- Rectangular shape with rounded corners
- Typically has visible text, numbers, or logos
- Can be any color or design

B) STANDARD BRICK (fallback if no card found):
- Standard UK/Imperial brick dimensions: 215mm x 102.5mm x 65mm
- Red, orange, or clay colored rectangular block
- Often has mortar between bricks
- Look for typical brick texture and appearance
- May be laid horizontally or vertically

TASK 2: Detect compliance objects
Analyze this image and identify ALL visible objects from this list: ${objectList}

For EACH object you detect, provide:
1. The exact object type from the list above
2. A confidence score (0.0 to 1.0)
3. Bounding box coordinates as percentages (x, y, width, height) where:
   - x: left edge position (0-100%)
   - y: top edge position (0-100%)
   - width: object width (0-100%)
   - height: object height (0-100%)

Important guidelines:
- Be thorough: detect ALL instances of the listed objects
- Windows: distinguish between "window" (fixed) and "opening_window" (can open)
- Vents: "air_vent" (passive) vs "fan_vent" (mechanical)
- Pipes: "soil_pipe" (large drainage) vs "downpipe" (rainwater)
- Only return objects from the provided list
- Provide accurate bounding boxes that tightly fit each object

Return ONLY a JSON object in this exact format:
{
  "creditCard": {
    "detected": true,
    "confidence": 0.95,
    "bounds": {"x": 10.0, "y": 80.0, "width": 15.0, "height": 9.5}
  },
  "brick": {
    "detected": true,
    "confidence": 0.90,
    "bounds": {"x": 20.0, "y": 30.0, "width": 18.0, "height": 8.5},
    "orientation": "horizontal"
  },
  "objects": [
    {
      "type": "opening_window",
      "confidence": 0.95,
      "bounds": {"x": 45.5, "y": 20.0, "width": 30.0, "height": 40.0}
    },
    {
      "type": "air_vent",
      "confidence": 0.88,
      "bounds": {"x": 15.0, "y": 60.0, "width": 15.0, "height": 15.0}
    }
  ]
}

If no credit card is detected, set "creditCard" to null.
If no brick is detected, set "brick" to null.
For brick orientation: "horizontal" if width > height, "vertical" if height > width.`;

  try {
    // Extract base64 image data (remove data:image/...;base64, prefix)
    const base64Data = image.split(',')[1] || image;
    const mediaType = image.includes('image/png') ? 'image/png' : 'image/jpeg';

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Extract the JSON response from Claude
    const content = data.content[0].text;

    // Parse the JSON - handle markdown code blocks
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const result = JSON.parse(jsonStr);

    // Extract credit card detection
    let creditCard = null;
    if (result.creditCard && result.creditCard.detected) {
      creditCard = {
        confidence: result.creditCard.confidence,
        bounds: {
          x: Math.round(result.creditCard.bounds.x * 10),
          y: Math.round(result.creditCard.bounds.y * 10),
          width: Math.round(result.creditCard.bounds.width * 10),
          height: Math.round(result.creditCard.bounds.height * 10)
        }
      };
    }

    // Extract brick detection
    let brick = null;
    if (result.brick && result.brick.detected) {
      brick = {
        confidence: result.brick.confidence,
        orientation: result.brick.orientation || 'horizontal',
        bounds: {
          x: Math.round(result.brick.bounds.x * 10),
          y: Math.round(result.brick.bounds.y * 10),
          width: Math.round(result.brick.bounds.width * 10),
          height: Math.round(result.brick.bounds.height * 10)
        }
      };
    }

    // Transform objects to our expected format
    const objects = (result.objects || []).map(det => ({
      type: det.type,
      label: det.type.toUpperCase().replace(/_/g, ' '),
      bounds: {
        x: Math.round(det.bounds.x * 10),
        y: Math.round(det.bounds.y * 10),
        width: Math.round(det.bounds.width * 10),
        height: Math.round(det.bounds.height * 10)
      },
      confidence: det.confidence,
      enabled: true
    }));

    return { objects, creditCard, brick };

  } catch (error) {
    console.error('Claude detection error:', error);
    throw new Error(`Claude object detection failed: ${error.message}`);
  }
}

/**
 * Fetch the latest knowledge snippets from D1 to prime AI responses
 */
async function fetchLatestKnowledge(env, categories = []) {
  const knowledge = {};

  if (!env.AGENT_DB) {
    return knowledge;
  }

  for (const category of categories) {
    try {
      const query = `SELECT content, version, effective_date FROM knowledge WHERE category = ? ORDER BY COALESCE(effective_date, version) DESC`;
      const statement = env.AGENT_DB.prepare(query).bind(category);
      const { results } = await statement.all();

      if (!results || results.length === 0) {
        continue;
      }

      const preferred = results.find(row => (row.version || '').toLowerCase().includes(PREFERRED_PRICEBOOK_VERSION.toLowerCase()));
      const latest = preferred || results[0];

      knowledge[category] = {
        content: latest.content,
        version: latest.version || 'unspecified',
        effectiveDate: latest.effective_date || null,
      };
    } catch (dbError) {
      console.warn(`Failed to load knowledge for category ${category}:`, dbError.message);
    }
  }

  return knowledge;
}

/**
 * Sanitize a transcription by applying domain-specific checks and using AI for context-driven corrections
 */
async function sanitizeTranscriptionWithAI(transcription, transcriptionContext = {}, env, knowledge = {}) {
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    throw new Error('AI API key not configured');
  }

  const knowledgeSummary = Object.entries(knowledge).map(([category, data]) => {
    const versionNote = data.version ? `Version: ${data.version}${data.version.toLowerCase().includes('2025') ? '' : ' (check for latest)'}` : 'Version unknown';
    return `Category: ${category}\n${versionNote}\n${data.content || ''}`;
  }).join('\n\n');

  const sanityRules = `
- Pipework sizes must be one of: ${ALLOWED_PIPE_SIZES_MM.join('mm, ')}mm.
- If a size is ambiguous (e.g., 9mm), round to the nearest valid size and note the correction.
- Use provided job context (location, appliance type, materials) to resolve unclear words.
- If pricebook details are mentioned, prefer the latest available version (aim for ${PREFERRED_PRICEBOOK_VERSION}).
- Correct obvious ASR mistakes ("price look" -> "pricebook", "ten mil" -> "10mm", etc.).
`;

  const prompt = `You are a heating industry transcription QA assistant. Clean up the provided raw transcription, applying domain sanity checks and contextual corrections.

RAW TRANSCRIPTION:
${transcription}

CONTEXT:
${JSON.stringify(transcriptionContext || {}, null, 2)}

REFERENCE KNOWLEDGE (latest-first):
${knowledgeSummary || 'None available'}

SANITY RULES:
${sanityRules}

Return ONLY JSON with this shape:
{
  "sanitizedTranscript": "corrected text",
  "corrections": [
    { "issue": "what was wrong", "fix": "how it was corrected" }
  ],
  "notes": "any additional notes about confidence or assumptions"
}`;

  let aiResult;
  try {
    aiResult = env.OPENAI_API_KEY
      ? await completeTextWithOpenAI(prompt, env.OPENAI_API_KEY)
      : await completeTextWithClaude(prompt, env.ANTHROPIC_API_KEY);
  } catch (primaryError) {
    if (env.ANTHROPIC_API_KEY && env.OPENAI_API_KEY) {
      aiResult = await completeTextWithClaude(prompt, env.ANTHROPIC_API_KEY);
    } else {
      throw primaryError;
    }
  }

  const sanitizedTranscript = enforcePipeworkSizes(aiResult.sanitizedTranscript || transcription);

  return {
    sanitizedTranscript,
    corrections: aiResult.corrections || [],
    notes: aiResult.notes || '',
    knowledgeUsed: knowledge,
  };
}

async function completeTextWithOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a meticulous compliance assistant for heating engineers.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI text completion error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  const parsed = parseJsonFromMarkdown(content);
  return parsed;
}

async function completeTextWithClaude(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude text completion error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text.trim();
  const parsed = parseJsonFromMarkdown(content);
  return parsed;
}

function parseJsonFromMarkdown(content) {
  let jsonStr = content;
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
  }
  return JSON.parse(jsonStr);
}

function enforcePipeworkSizes(text) {
  if (!text) return text;

  return text.replace(/\b(\d{1,2})\s*mm\b/gi, (match, size) => {
    const numericSize = parseInt(size, 10);
    let closest = ALLOWED_PIPE_SIZES_MM[0];
    let minDiff = Math.abs(numericSize - closest);

    for (const allowed of ALLOWED_PIPE_SIZES_MM) {
      const diff = Math.abs(numericSize - allowed);
      if (diff < minDiff) {
        minDiff = diff;
        closest = allowed;
      }
    }

    return `${closest}mm`;
  });
}

/**
 * Detect blue calibration card in the image
 * Returns calibration data or null if not detected
 *
 * Note: This is a simplified server-side detection.
 * The frontend also does client-side blue card detection.
 */
function detectBlueCard(imageDataUrl) {
  // For now, we'll return null and let the frontend handle calibration
  // In a future version, we could implement server-side blue card detection
  // using image processing libraries

  return {
    blueCardDetected: false,
    pixelsPerMM: null
  };
}

/**
 * Helper function to create JSON responses with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
