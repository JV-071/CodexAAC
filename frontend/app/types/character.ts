export interface Character {
  id: number
  name: string
  vocation: string
  level: number
  world: string
  status: 'online' | 'offline'
  lookType: number
  lookHead: number
  lookBody: number
  lookLegs: number
  lookFeet: number
  lookAddons: number
}

export interface CharacterDetails {
  name: string
  sex: string
  vocation: string
  level: number
  residence: string
  guildName?: string
  guildRank?: string
  lastSeen: number
  created: number
  accountStatus: string
  status: string
  lookType: number
  lookHead: number
  lookBody: number
  lookLegs: number
  lookFeet: number
  lookAddons: number
}

export interface Death {
  time: number
  level: number
  killedBy: string
  isPlayer: boolean
}

export interface CharacterDetailsResponse {
  character: CharacterDetails
  deaths: Death[]
}

export interface ApiResponse<T> {
  message: string
  status: string
  data: T
}

export interface CharactersApiResponse extends ApiResponse<Character[]> {}

