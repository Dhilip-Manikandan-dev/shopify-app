import { NextApiResponse } from "next";
import { withAuth, AuthenticatedNextApiRequest } from "@/server/auth/withAuth";
import { RuleService } from "@/server/services/rule/ruleService";
import { ApiResponse } from "@/types/api";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: { code: "METHOD_NOT_ALLOWED", message: `Method ${req.method} not allowed` },
    });
  }

  const { rule, context } = req.body;
  if (!rule || !context) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Both rule and context are required for testing" },
    });
  }

  try {
    const testResult = RuleService.testDraftRule(rule, context);
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
