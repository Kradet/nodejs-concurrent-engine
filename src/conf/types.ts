import fs from "fs"
import YAML from "yaml"

export interface AppConfig {
  development: DevelopmentConfig
  general: GeneralConfig
  rules: Rule[]
}

export interface DevelopmentConfig {
  developerMail: string
}

export interface GeneralConfig {
  senderMail: string
  receiversMails: string[]
  pageToScrap: string
}

export interface Rule {
  scenario: number
  lowerLimit: number
  upperLimit: number | null
  risk: string
  recommendation: string
  riskLevel: number
}

const file = fs.readFileSync("config.yml", "utf-8")
const config = YAML.parse(file) as AppConfig

// validates is config exist
if (config !== null && config !== undefined) {
  console.log("config loaded")
} else {
  throw new Error("config file not found")
}

// todo: validate config format whit zod
export { config }
