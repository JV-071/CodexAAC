import type { Outfit } from './character'

export interface TeamPlayer extends Outfit {
  name: string
  groupId: number
  role: string
  world: string
}

export interface TeamResponse {
  tutors: TeamPlayer[]
  administration: TeamPlayer[]
}
