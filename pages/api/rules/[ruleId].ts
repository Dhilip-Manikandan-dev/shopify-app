import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { RuleService } from "@/server/services/rule/ruleService";
import { UpdateRuleSchema } from "@/server/validators/ruleValidators";
import { ApiResponse } from "@/types/api";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  const storeId = req.store.id;
  const ruleId = String(req.query.ruleId);

  if (req.method === "GET") {
    try {
      const rule = await RuleService.getRuleById(storeId, ruleId);
      return res.status(200).json({
        success: true,
        data: rule,
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RULE_NOT_FOUND",
          message: err.message,
        },
      });
    }
  }

  if (req.method === "PUT") {
    const validation = UpdateRuleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid rule update payload",
          details: validation.error.flatten(),
        },
      });
    }

    try {
      const updated = await RuleService.updateRule(storeId, ruleId, validation.data);
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RULE_NOT_FOUND",
          message: err.message,
        },
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await RuleService.archiveRule(storeId, ruleId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RULE_NOT_FOUND",
          message: err.message,
        },
      });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({
    success: false,
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: `Method ${req.method} not allowed`,
    },
  });
}

export default withAuth(handler);
