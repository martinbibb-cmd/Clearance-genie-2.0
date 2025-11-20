# AI Worker Deployment Guide

This guide explains how to deploy the Clearance Genie AI Worker to Cloudflare.

## Overview

The AI Worker provides object detection capabilities for the Clearance Genie heating compliance application using OpenAI's Vision API (GPT-4 Omni).

**Worker Domain**: `https://clearance.martinbibb.workers.dev`

## Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **OpenAI API Key** with access to GPT-4 Vision
3. **Wrangler CLI** installed globally

## Installation Steps

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure OpenAI API Key

Set your OpenAI API key as a secret (not in code):

```bash
wrangler secret put OPENAI_API_KEY
```

When prompted, paste your OpenAI API key (starts with `sk-`).

### 5. Deploy the Worker

```bash
npm run deploy
```

Or directly:

```bash
wrangler deploy
```

## Configuration

### Custom Domain Setup

The worker is configured to run at `clearance.martinbibb.workers.dev`.

To set up the custom domain:

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Settings > Triggers
5. Add custom domain: `clearance.martinbibb.workers.dev`

### Environment Variables

The worker uses the following environment variables:

- `OPENAI_API_KEY` (secret): Your OpenAI API key for GPT-4 Vision
- `WORKER_ENV` (var): Set to "production" in wrangler.toml

## Testing the Worker

### Local Development

Test locally before deploying:

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`

### Testing with cURL

```bash
curl -X POST https://clearance.martinbibb.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "equipmentType": "flue",
    "detectObjects": ["window", "door", "air_vent"]
  }'
```

### Expected Response

```json
{
  "success": true,
  "objects": [
    {
      "type": "window",
      "label": "WINDOW",
      "bounds": {
        "x": 450,
        "y": 200,
        "width": 300,
        "height": 400
      },
      "confidence": 0.92,
      "enabled": true
    }
  ],
  "calibration": {
    "blueCardDetected": false,
    "pixelsPerMM": null
  }
}
```

## Monitoring

### View Logs

```bash
npm run tail
```

Or:

```bash
wrangler tail
```

### Check Deployment Status

```bash
wrangler deployments list
```

## API Costs

### OpenAI Vision API Pricing (as of 2024)

- **GPT-4 Omni**: ~$0.005 per image (1024x1024)
- **Monthly estimate**: For 1000 detections/month = ~$5

### Cloudflare Workers Pricing

- **Free tier**: 100,000 requests/day
- **Paid plan**: $5/month for 10M requests

## Troubleshooting

### Worker Returns 500 Error

1. Check if OpenAI API key is set:
   ```bash
   wrangler secret list
   ```

2. View logs for detailed error:
   ```bash
   wrangler tail
   ```

3. Verify OpenAI API key has GPT-4 Vision access

### CORS Errors

The worker includes CORS headers. If you see CORS errors:

1. Check browser console for specific error
2. Verify the worker is deployed correctly
3. Ensure OPTIONS requests are handled

### Image Too Large Error

Maximum image size is 5MB. The frontend compresses to JPEG at 0.8 quality, which should be well under this limit.

If you get size errors:

1. Reduce JPEG quality in `clearance-genie-ai.html` (line 690)
2. Resize image before encoding
3. Increase limit in `src/index.js` (line 52)

### Rate Limiting

OpenAI API has rate limits:

- **GPT-4 Omni**: 500 requests/minute (tier 1)
- Consider implementing caching for repeated images
- Add exponential backoff for retries

## Security Considerations

1. **Never commit API keys** - Use Wrangler secrets
2. **Validate inputs** - Worker checks image size and format
3. **Rate limiting** - Consider adding per-IP rate limits
4. **CORS policy** - Currently allows all origins (`*`)

## Next Steps

### Optional Enhancements

1. **Image Caching**: Cache detection results for identical images
2. **Blue Card Detection**: Implement server-side calibration card detection
3. **Batch Processing**: Support multiple images in one request
4. **Webhooks**: Send results asynchronously for large images
5. **Analytics**: Track usage and performance metrics

## Support

For issues with:
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **OpenAI API**: https://platform.openai.com/docs/
- **This Project**: Create an issue on GitHub

## License

MIT License - See LICENSE file for details
