#!/usr/bin/env node

/**
 * Outstatic CLI
 *
 * Commands:
 *   outstatic typegen          Generate TypeScript types from schemas
 *   outstatic typegen --watch  Watch for schema changes and regenerate
 *
 * Options:
 *   --content-path  Path to content directory (default: outstatic/content)
 *   --output-path   Path to output types (default: .outstatic/types)
 *   --help          Show help
 */

import { generateTypes, watchSchemas } from '../typegen/generator'

interface CliOptions {
  contentPath?: string
  outputPath?: string
  watch: boolean
  help: boolean
}

function parseArgs(args: string[]): { command: string; options: CliOptions } {
  const options: CliOptions = {
    watch: false,
    help: false
  }

  let command = ''

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--watch' || arg === '-w') {
      options.watch = true
    } else if (arg === '--content-path') {
      options.contentPath = args[++i]
    } else if (arg === '--output-path') {
      options.outputPath = args[++i]
    } else if (!arg.startsWith('-') && !command) {
      command = arg
    }
  }

  return { command, options }
}

function showHelp(): void {
  console.log(`
Outstatic CLI

Usage:
  outstatic <command> [options]

Commands:
  typegen     Generate TypeScript types from collection/singleton schemas

Options:
  --watch, -w         Watch for schema changes and regenerate types
  --content-path      Path to content directory (default: outstatic/content)
  --output-path       Path to output types (default: .outstatic/types)
  --help, -h          Show this help message

Examples:
  outstatic typegen
  outstatic typegen --watch
  outstatic typegen --content-path content --output-path types
`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const { command, options } = parseArgs(args)

  if (options.help || !command) {
    showHelp()
    process.exit(options.help ? 0 : 1)
  }

  if (command === 'typegen') {
    const generatorOptions = {
      contentPath: options.contentPath,
      outputPath: options.outputPath
    }

    if (options.watch) {
      console.log('Starting type generation in watch mode...')
      await watchSchemas(generatorOptions)
      // Keep the process running
      process.stdin.resume()
    } else {
      console.log('Generating types...')
      generateTypes(generatorOptions)
      console.log('Done!')
    }
  } else {
    console.error(`Unknown command: ${command}`)
    showHelp()
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
