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
      const { image, equipmentType, detectObjects } = await request.json();

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

      // Call OpenAI Vision API for both object and credit card detection
      const { objects: detectedObjects, creditCard } = await detectObjectsWithOpenAI(
        image,
        equipmentType,
        detectObjects,
        env.OPENAI_API_KEY
      );

      // Build calibration response
      const calibration = {
        creditCardDetected: creditCard !== null,
        creditCardBounds: creditCard,
        pixelsPerMM: null  // Will be calculated on frontend
      };

      // Return successful response
      return jsonResponse({
        success: true,
        objects: detectedObjects,
        calibration: calibration
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

/**
 * Detect objects using OpenAI Vision API (GPT-4 Vision)
 */
async function detectObjectsWithOpenAI(image, equipmentType, detectObjects, apiKey) {
  // Build a detailed prompt for object detection AND credit card detection
  const objectList = detectObjects.join(', ');

  const prompt = `You are an expert computer vision system for heating compliance detection.

TASK 1: Detect a credit card (if present) for calibration
Look for a credit card or card-shaped object in the image. A credit card has:
- Standard dimensions with aspect ratio of approximately 1.586:1 (85.6mm x 53.98mm)
- Rectangular shape with rounded corners
- Typically has visible text, numbers, or logos
- Can be any color or design

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

If no credit card is detected, set "creditCard" to null.`;

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

    return { objects, creditCard };

  } catch (error) {
    console.error('OpenAI detection error:', error);
    throw new Error(`Object detection failed: ${error.message}`);
  }
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
