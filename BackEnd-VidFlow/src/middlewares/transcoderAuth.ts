import { Request, Response, NextFunction } from "express";

export function transcoderAuth(req: Request, res: Response, next: NextFunction) {
	if (!process.env.TRANSCODER_SECRET) {
		return res
			.status(500)
			.json({ code: 500, msg: "Server misconfiguration: TRANSCODER_SECRET is not set" });
	}
	const secret = req.header("X-Transcoder-Secret");

	if (!secret || secret !== process.env.TRANSCODER_SECRET) {
		return res.status(401).json({ code: 401, msg: "Unauthorized" });
	}
	next();
}
