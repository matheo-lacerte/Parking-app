// Deprecated: Express wrapper. The app is now fully serverless
// via function files under `api/`. This file remains for clarity.
export default function handler(req, res) {
	return res.status(410).json({
		error: 'Deprecated endpoint. Use serverless routes under /api/.',
	});
}
