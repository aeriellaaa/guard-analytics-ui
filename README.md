# FraudOps Insights Hub

create a website,fraud-ops dashboard has a specific visual language (data-dense, trustworthy, not playful) Proposed screens, mapped to what you've actually built:

Overview/Metrics dashboard — the /metrics data made visual: AUC, recall, cost-optimal threshold, the baseline comparison (rules vs. naive vs. trained model) as a chart, total cost saved vs. default threshold. This is your strongest "prove it works" screen.

Live transaction tester — a form to submit a transaction (or pick a preset like your curated real fraud case, transaction 7685) and watch it flow through Agent 1 → 2 → 3 → Decision Router in real time, showing the SHAP evidence and Reviewer Agent's reasoning as it resolves. This is your best live-demo screen.

Audit log viewer — browse the append-only log, filterable by transaction, showing every stage.

Entity-drift demo — pick one of your 8 real Razorpay customers, show their transaction history, run the entity-drift check live, see it flag the deliberately-elevated one.

Pipeline selector — toggle between your original pipeline and the IEEE-CIS pipeline, since you now genuinely have both.Tech stack call, before scaffolding: React (via Vite) + calling your FastAPI backend directly (needs CORS enabled on the backend, quick addition), or do you want something simpler like a single-page vanilla HTML/JS app? React gives more polish and matches "full custom UI," but it's more setup. Given you said full custom, I'd default to React unless you'd rather keep it lighter.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://guard-analytics-ui.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5daae3ea-8763-45ff-b701-40e603822bb1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
