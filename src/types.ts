export interface ChabadCenter {
  id: string
  name: string
  shliach: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  type: string
  url: string
}

export interface Mover {
  id: string
  firstName: string
  lastName: string
  oldAddress: string
  oldCity: string
  oldState: string
  oldZip: string
  newAddress: string
  newCity: string
  newState: string
  newZip: string
  moveType?: string
  excluded?: boolean
}

export interface MatchedGroup {
  center: ChabadCenter
  distance: number
  movers: Mover[]
}

export interface UnmatchedGroup {
  zip: string
  movers: Mover[]
}

export type CsvProvider = 'truencoa' | 'ncoasource' | 'salesforce' | 'chabadcms' | 'generic'

export interface ColumnMapping {
  firstName?: string
  lastName?: string
  oldAddress?: string
  oldCity?: string
  oldState?: string
  oldZip?: string
  newAddress?: string
  newCity?: string
  newState?: string
  newZip?: string
  moveType?: string
  recordType?: string
  inputId?: string
}

export interface SenderInfo {
  name: string
  chabadHouse: string
  phone: string
  email: string
}

export type WizardStep = 'upload' | 'review' | 'match' | 'email'
