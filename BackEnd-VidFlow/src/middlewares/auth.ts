import { Request, Response, NextFunction } from "express";
import { decodeToken } from "src/lib/jwt";

export const auth = (optional: boolean = false) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const authHeader = req.headers.authorization;

			if (!authHeader) {
				if (optional) {
					return next();
				}

				return res.status(401).json({ code: 401, message: "Missing Authorization header" });
			}

			if (!authHeader.startsWith("Bearer ")) {
				if (optional) {
					return next();
				}

				return res.status(401).json({ code: 401, msg: "Invalid Authorization header format" });
			}

			const token = authHeader.split(" ")[1];
			if (!token) {
				if (optional) {
					return next();
				}

				return res.status(401).json({ code: 401, message: "Missing token" });
			}

			const user = decodeToken(token);

			req.user = { id: user.id, role: user.role };
			next();
		} catch (error) {
			if (optional) {
				return next();
			}
			return res.status(401).json({ code: 401, message: "Invalid or expired token" });
		}
	};
};
