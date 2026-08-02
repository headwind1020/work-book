/**
 * 把含 LaTeX 的文本清洗成普通人阅读的纯文本
 *
 * 处理规则：
 * 1. 删除所有 $ 符号
 * 2. \frac{a}{b} → a/b
 * 3. 删除 {} 大括号（保留内文）
 * 4. _下标_ 转为 a₁ a₂ a₃ 等简单下标
 * 5. \\ 转 \n
 * 6. 删除剩余 \cmd 命令
 *
 * @example
 *   stripLatex('$y = 2x - 4$ 与 $x$ 轴')
 *   → 'y = 2x - 4 与 x 轴'
 *
 *   stripLatex('$\\frac{7}{2}$')
 *   → '7/2'
 */
export function stripLatex(input: string): string {
  if (!input) return ''

  let s = input

  // 1. 处理 \frac{a}{b} → a/b（支持嵌套）
  s = convertFrac(s)

  // 2. 下标：x_1 → x₁；x_{10} → x₁₀
  s = s.replace(/_\{(\d+)\}/g, (_, n) => toSubscript(n))
  s = s.replace(/_(\d)/g, (_, n) => toSubscript(n))

  // 3. 上标：x^2 → x²；x^{10} → x¹⁰
  s = s.replace(/\^\{(\d+)\}/g, (_, n) => toSuperscript(n))
  s = s.replace(/\^(\d)/g, (_, n) => toSuperscript(n))

  // 4. \\ → 换行
  s = s.replace(/\\\\/g, '\n')

  // 5. 删除所有 $ 符号
  s = s.replace(/\$/g, '')

  // 6. 删除 \cmd{...} 命令（保留花括号内文本）
  s = s.replace(/\\[a-zA-Z]+\b/g, '')

  // 7. 删除剩余大括号
  s = s.replace(/[{}]/g, '')

  // 8. 折叠多余空白
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

  return s
}

/** 递归处理 \frac{a}{b}（支持 \frac{a}{b/c} 嵌套） */
function convertFrac(input: string): string {
  let s = input
  // 反复替换直到没有更多 \frac
  let prev = ''
  while (prev !== s) {
    prev = s
    // 简单形式 \frac{a}{b}
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
  }
  return s
}

/** 把数字串转下标字符 */
function toSubscript(n: string): string {
  const map: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  }
  return n.split('').map((c) => map[c] ?? c).join('')
}

/** 把数字串转上标字符 */
function toSuperscript(n: string): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  }
  return n.split('').map((c) => map[c] ?? c).join('')
}

/**
 * 进一步清洗模型返回的 analysis 字段
 * - 去除"步骤1: 步骤2: "等冗余编号
 * - 合并多行空格
 */
export function cleanAnalysis(input: string): string {
  if (!input) return ''
  return stripLatex(input)
    // 去掉"步骤1:" "步骤2:"等过多元数据（可选）
    // .replace(/步骤\s*\d+[:：]\s*/g, '')
    .trim()
}