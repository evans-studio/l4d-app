#!/usr/bin/env node
/*
  Enforce a simple performance budget by computing per-route First Load JS
  from .next/build-manifest.json and actual file sizes on disk.

  Default budget: 500 kB per route (override with PERFORMANCE_BUDGET_KB env var)
*/
const fs = require('fs')
const path = require('path')

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`
}

function getBudgetBytes() {
  const kb = Number(process.env.PERFORMANCE_BUDGET_KB || 500)
  return Math.max(1, Math.floor(kb * 1024))
}

function safeStatSize(filePath) {
  try {
    const stats = fs.statSync(filePath)
    return stats.size || 0
  } catch {
    return 0
  }
}

function main() {
  if (String(process.env.SKIP_PERF_BUDGET).toLowerCase() === 'true') {
    console.log('Skipping performance budget enforcement (SKIP_PERF_BUDGET=true)')
    process.exit(0)
  }
  const manifestPath = path.join('.next', 'build-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.log('build-manifest.json not found. Skipping (no build artifacts).')
    process.exit(0)
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const routes = manifest.pages || {}
  const budgetBytes = getBudgetBytes()

  let maxBytes = 0
  let maxRoute = 'unknown'
  const results = []

  for (const route of Object.keys(routes)) {
    const files = routes[route] || []
    // Only count JS files that contribute to first load
    const jsFiles = files.filter((f) => f.endsWith('.js'))
    const totalBytes = jsFiles.reduce((sum, rel) => {
      const abs = path.join('.next', rel)
      return sum + safeStatSize(abs)
    }, 0)
    results.push({ route, bytes: totalBytes })
    if (totalBytes > maxBytes) {
      maxBytes = totalBytes
      maxRoute = route
    }
  }

  results.sort((a, b) => b.bytes - a.bytes)
  const top = results.slice(0, 10)

  const header = `Performance Budget Report (budget=${formatKb(budgetBytes)})`
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const r of top) {
    console.log(`${r.route.padEnd(30)} ${formatKb(r.bytes)}`)
  }

  if (maxBytes > budgetBytes) {
    console.error(
      `Budget exceeded on ${maxRoute}: ${formatKb(maxBytes)} > ${formatKb(budgetBytes)}`
    )
    process.exit(1)
  }

  console.log(`Budget passed. Max route ${maxRoute}: ${formatKb(maxBytes)}`)
}

main()