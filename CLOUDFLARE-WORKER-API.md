# Cloudflare Worker API Specification

## Endpoint
`https://clearance-genie-worker.martinbibb.workers.dev`

## Request Format

The app sends a POST request with the following JSON body:

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "equipmentType": "flue",
  "detectObjects": [
    "window",
    "opening_window",
    "air_vent",
    "fan_vent",
    "door",
    "soil_pipe",
    "downpipe"
  ]
}
```

### Request Fields

- **image** (string): Base64-encoded image data URL (JPEG format, 0.8 quality)
- **equipmentType** (string): One of: `flue`, `boiler`, `radiator`, `cylinder`
- **detectObjects** (array): List of object types to detect based on equipment type

## Equipment-Specific Object Lists

### Flue Terminal
```javascript
detectObjects: [
  'window',
  'opening_window',
  'air_vent',
  'fan_vent',
  'door',
  'soil_pipe',
  'downpipe'
]
```

### Boiler
```javascript
detectObjects: [
  'plug_socket',
  'window',
  'cupboard',
  'shelf',
  'wall',
  'door'
]
```

### Radiator
```javascript
detectObjects: [
  'plug',
  'window',
  'curtain',
  'furniture',
  'wall'
]
```

### Cylinder
```javascript
detectObjects: [
  'door',
  'shelf',
  'pump',
  'valve',
  'wall',
  'ceiling'
]
```

## Expected Response Format

The worker should return a JSON response with detected objects:

```json
{
  "success": true,
  "objects": [
    {
      "type": "opening_window",
      "label": "OPENING WINDOW",
      "bounds": {
        "x": 450,
        "y": 200,
        "width": 300,
        "height": 400
      },
      "confidence": 0.92,
      "enabled": true
    },
    {
      "type": "air_vent",
      "label": "AIR VENT",
      "bounds": {
        "x": 150,
        "y": 600,
        "width": 150,
        "height": 150
      },
      "confidence": 0.87,
      "enabled": true
    }
  ],
  "calibration": {
    "blueCardDetected": true,
    "pixelsPerMM": 2.5
  }
}
```

### Response Fields

- **success** (boolean): Whether detection was successful
- **objects** (array): List of detected objects
  - **type** (string): Object type from the `detectObjects` list
  - **label** (string): Human-readable label (used in UI)
  - **bounds** (object): Bounding box coordinates
    - **x** (number): Left position in pixels
    - **y** (number): Top position in pixels
    - **width** (number): Width in pixels
    - **height** (number): Height in pixels
  - **confidence** (number): Detection confidence (0.0 to 1.0)
  - **enabled** (boolean): Whether object is included (default: true)
- **calibration** (object, optional): Calibration data
  - **blueCardDetected** (boolean): If blue calibration card was found
  - **pixelsPerMM** (number): Calculated pixels per millimeter

## Error Response Format

If detection fails, return:

```json
{
  "success": false,
  "error": "Error message description",
  "objects": []
}
```

## Example Cloudflare Worker Code

```javascript
export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { image, equipmentType, detectObjects } = await request.json();

      // Here you would integrate with an AI vision API
      // Examples: OpenAI Vision API, Google Cloud Vision, AWS Rekognition
      // or use Cloudflare AI Workers AI

      // Example using Cloudflare AI (Workers AI)
      const ai = new Ai(env.AI);

      // Convert base64 to buffer
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Run object detection
      const response = await ai.run('@cf/meta/detr-resnet-50', {
        image: [...imageBuffer]
      });

      // Transform AI response to our format
      const objects = response.map(detection => ({
        type: mapLabelToType(detection.label, detectObjects),
        label: detection.label.toUpperCase(),
        bounds: {
          x: detection.box.xmin,
          y: detection.box.ymin,
          width: detection.box.xmax - detection.box.xmin,
          height: detection.box.ymax - detection.box.ymin
        },
        confidence: detection.score,
        enabled: true
      })).filter(obj => obj.type !== null);

      return new Response(JSON.stringify({
        success: true,
        objects: objects
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        objects: []
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

function mapLabelToType(aiLabel, detectObjects) {
  // Map AI model labels to our object types
  const mappings = {
    'window': ['window', 'opening_window'],
    'door': ['door'],
    'electrical outlet': ['plug_socket', 'plug'],
    'vent': ['air_vent', 'fan_vent'],
    'pipe': ['soil_pipe', 'downpipe'],
    'cabinet': ['cupboard'],
    'shelf': ['shelf'],
    'furniture': ['furniture'],
    'curtain': ['curtain'],
    'wall': ['wall'],
    'ceiling': ['ceiling']
  };

  for (const [aiKey, ourTypes] of Object.entries(mappings)) {
    if (aiLabel.toLowerCase().includes(aiKey)) {
      return ourTypes.find(type => detectObjects.includes(type)) || null;
    }
  }

  return null;
}
```

## AI Integration Options

### Option 1: Cloudflare Workers AI (Recommended)
- Built-in AI models on Cloudflare's edge
- Model: `@cf/meta/detr-resnet-50` for object detection
- No external API keys needed
- Fast and cost-effective

### Option 2: OpenAI Vision API
- High accuracy
- Requires API key
- Higher cost per request

### Option 3: Google Cloud Vision API
- Excellent object detection
- Requires Google Cloud account
- Pay per request

### Option 4: AWS Rekognition
- Good object detection
- Requires AWS account
- Pay per image

## Fallback Behavior

The frontend app includes fallback mock detection if the API:
- Returns an error
- Is unavailable (403, 500, etc.)
- Takes too long to respond

The mock detection generates 2-4 random objects based on equipment type for demonstration purposes.

## Testing the Worker

You can test the worker using curl:

```bash
curl -X POST https://clearance-genie-worker.martinbibb.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "equipmentType": "flue",
    "detectObjects": ["window", "door", "air_vent"]
  }'
```

## CORS Configuration

The worker MUST include CORS headers to allow browser requests:

```javascript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

## Performance Recommendations

- Compress images before sending (0.8 JPEG quality)
- Set reasonable timeout (10-15 seconds)
- Cache results if possible
- Use Cloudflare's edge caching for static responses

## Security Considerations

- Validate image size (limit to 5MB)
- Rate limit requests per IP
- Sanitize all inputs
- Don't expose API keys in responses
- Use environment variables for secrets
