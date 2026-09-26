import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { RuleService } from "@/server/services/rule/ruleService";
import { ApiResponse } from "@/types/api";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  const storeId = req.store.id;
  const ruleId = String(req.query.ruleId);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: { code: "METHOD_NOT_ALLOWED", message: `Method ${req.method} not allowed` },
    });
  }

  try {
    const testResult = await RuleService.testRule(storeId, ruleId, req.body);
    return res.status(200).json({
      success: true,
      data: testResult,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: "RULE_TEST_ERROR", message: err.message },
    });
  }
}

export default withAuth(handler);
