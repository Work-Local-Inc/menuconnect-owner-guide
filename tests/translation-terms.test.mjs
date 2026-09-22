import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/guide-translations.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context, { filename: 'guide-translations.js' });
const { zh } = context.window.MenuConnectTranslations;

// Exact, consequential terminology checks: a change of payment direction, operator,
// action, or time window here could cause an owner to take the wrong action.
const corrections = {
  'Net payout': '净入账金额',
  'Lesson 4 · Why the payout can differ': '第 4 课 · 为什么入账金额可能不同',
  'Quick answer: Understand a smaller payout': '快速解答：了解入账金额为何减少',
  'Commission is collected from the card money we hold for you. If a week is mostly cash orders, the card money may not cover commission and fees — the small balance simply carries forward to a future week. Your home page banner shows this whenever it happens.': '佣金从我们代您持有的银行卡付款资金中收取。如果一周内大多是现金订单，这笔资金可能不足以支付佣金和费用；未结清的小额余额会结转到以后的一周。发生这种情况时，首页横幅会显示提示。',
  'Review gross sales, cash and card orders, deductions, refunds, and net payout first (Lessons 3–4). Use Owner help if it still does not reconcile.': '先核对销售总额、现金和银行卡订单、扣款、退款以及净入账金额（第 3–4 课）。如果仍无法对账，请通过“店主帮助”联系团队。',
  'Confirm the customer, placement time, status, total, captured amount, and refunded amount.': '核对顾客、下单时间、订单状态、总额、已收款金额及已退款金额。',
  'Captured': '已收款',
  'Last 12 weeks — net payouts': '过去 12 周 — 净入账金额',
  'It shows either a net payout or a carried balance. Lesson 3 explains exactly why.': '这里显示净入账金额或结转余额。第 3 课详细解释了原因。',
  'What lands in your bank account for the week. Below this section, the real statement lists every single order — number, time, total, and fee — so you can trace any figure.': '本周实际存入您银行账户的金额。本节下方的正式报表列出每笔订单的订单号、时间、总额和费用，方便您核对任何金额。',
  'A busy week does not always equal the same-size bank deposit. Your statement combines orders paid online with orders paid directly to the restaurant, then applies the charges in your agreement.': '订单繁忙的一周，银行账户入账金额不一定同样高。报表汇总线上付款和直接向餐厅付款的订单，再按协议扣除相关费用。',
  'Open the relevant weekly statement. Compare cash and card sales, deductions, refunds, commission credits, and net payout. Cash collected at your restaurant is not money Menu.ca is holding to pay out.': '打开相关的每周报表，比较现金和银行卡销售额、扣款、退款、佣金抵扣额及净入账金额。餐厅已收取的现金并非 Menu.ca 持有、等待向您支付的款项。',
  'Compare gross sales, deductions, refunds, and the final net payout.': '比较销售总额、扣款、退款和最终净入账金额。',
  'Card funds move through the statement': '银行卡付款资金计入报表',
  'Card processing fees apply to card orders. The remaining held funds contribute to the net payout.': '银行卡订单需支付银行卡处理费。扣除相关费用后，Menu.ca 持有的剩余款项计入净入账金额。',
  'If held card funds do not cover commission and fees, the remaining balance can carry forward. That is not automatically a missing payment.': '如果 Menu.ca 持有的银行卡付款资金不足以支付佣金和费用，未结清余额可结转至下一期；这不一定意味着有款项漏付。',
  'Refunds (1)': '退款 (1)',
  'One order was refunded this week. Refunds always land in the week they happen — a past statement never changes after it\'s frozen.': '本周有一笔订单已退款。退款计入实际发生退款的那一周；已锁定的往期报表不会更改。',
  'A later refund appears in the statement period when it is processed rather than rewriting an older statement.': '后续退款计入处理退款时所在的报表周期，不会修改之前的报表。',
  'Before acceptance, the restaurant can reject or cancel on its tablet. After acceptance, refunds go through Owner help (Lessons 12, 14–15). Look up the order first and include its number, date, customer, and amount.': '接单前，餐厅可在平板电脑上拒绝或取消订单。接单后，请通过“店主帮助”申请退款（第 12、14–15 课）。先查找订单，并提供订单号、日期、顾客姓名及金额。',
  'Send Owner help everything needed the first time': '首次联系“店主帮助”时提供所有必要信息',
  'Use Owner help with the statement period and order number if the figures still do not make sense.': '如果金额仍无法核对，请通过“店主帮助”提供报表周期和订单号。',
  'Apply': '应用',
  'Save hours': '保存营业时间',
  'change Friday close to 10pm': '将周五关门时间改为晚上 10 点',
  '⚠ Close for the rest of today': '⚠ 今天剩余时间停止接单',
  'Close for the rest of today': '今天剩余时间停止接单',
  'Closing today is for stopping new orders. Look up existing orders separately. After acceptance, use Owner help for a cancellation or refund; include the order details and requested outcome.': '当日停业仅用于停止接收新订单。请另行查询已接订单。接单后如需取消或退款，请通过“店主帮助”提供订单详情及所需处理结果。',
  'Remove the same-day closure only after the kitchen and ordering setup are genuinely ready.': '仅在厨房和接单设备确实准备就绪后，才解除当日停业设置。',
  'Hours or delivery': '营业时间或配送',
  'Restaurant, exact dates or recurring days, opening/closing times, delivery zone or minimum, and when it should start.': '餐厅名称、具体日期或每周固定日期、开门/关门时间、配送区域或最低起送金额，以及生效时间。',
};

test('Chinese financial and operational instructions preserve the direction, action and timing', () => {
  for (const [key, expected] of Object.entries(corrections)) {
    assert.equal(zh[key], expected, `Incorrect Chinese translation of ${key}`);
  }
});

test('critical technical tokens and numbers remain intact in translated instructions', () => {
  for (const key of ['Refunds (1)', 'change Friday close to 10pm', 'Before acceptance, the restaurant can reject or cancel on its tablet. After acceptance, refunds go through Owner help (Lessons 12, 14–15). Look up the order first and include its number, date, customer, and amount.']) {
    const tokens = key === 'Refunds (1)' ? ['1'] : key.includes('10pm') ? ['10'] : ['12', '14', '15'];
    for (const token of tokens) assert.ok(zh[key].includes(token), `${key} lost ${token}`);
  }
});
