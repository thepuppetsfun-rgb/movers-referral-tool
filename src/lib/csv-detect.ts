import type { CsvProvider, ColumnMapping } from '../types'

const normalize = (h: string) => h.toLowerCase().trim().replace(/[\s_\-./]+/g, '_')

export function detectProvider(headers: string[]): CsvProvider {
  const norm = headers.map(normalize)

  if (norm.some(h => h === 'record_type') && norm.some(h => h.includes('move_type')))
    return 'truencoa'

  if (norm.some(h => h === 'new_address_flag' || h.startsWith('mailto')))
    return 'ncoasource'

  if (norm.some(h => h === 'preferred_address' || h === 'import_id' || h === 'constituent_id'))
    return 'salesforce'

  if (norm.some(h => h === 'wife_first_name' || h === 'name_line_2'))
    return 'chabadcms'

  return 'generic'
}

const ALIASES: Record<keyof ColumnMapping, string[]> = {
  firstName: [
    'first_name', 'firstname', 'fname', 'first',
    'individual_first_name', 'input_individual_first_name',
    'contact_first_name', 'primary_first_name',
  ],
  lastName: [
    'last_name', 'lastname', 'lname', 'last',
    'individual_last_name', 'input_individual_last_name',
    'contact_last_name', 'primary_last_name',
  ],
  oldAddress: [
    'input_address_line_1', 'old_address', 'original_address',
    'input_address', 'current_address', 'address_line_1',
    'mailing_street', 'address', 'street',
  ],
  oldCity: [
    'input_address_city_name', 'input_city', 'old_city',
    'original_city', 'mailing_city', 'city',
  ],
  oldState: [
    'input_address_state_code', 'input_state', 'old_state',
    'original_state', 'mailing_state', 'state',
  ],
  oldZip: [
    'input_address_postal_code', 'input_zip', 'old_zip',
    'original_zip', 'mailing_zip', 'mailing_postal_code',
    'zip_code', 'zip', 'postal_code', 'zipcode',
  ],
  newAddress: [
    'address_line_1', 'new_address', 'new_address_line_1',
    'mailto1_address', 'forwarding_address', 'updated_address',
  ],
  newCity: [
    'city_name', 'address_city_name', 'new_city',
    'forwarding_city', 'updated_city',
  ],
  newState: [
    'state_code', 'address_state_code', 'new_state',
    'forwarding_state', 'updated_state',
  ],
  newZip: [
    'postal_code', 'address_postal_code', 'new_zip',
    'new_postal_code', 'forwarding_zip', 'updated_zip',
    'new_zip_code', 'new_zipcode',
  ],
  moveType: [
    'move_type', 'movetype', 'move_flag', 'match_flag',
  ],
  recordType: [
    'record_type', 'recordtype', 'rec_type',
  ],
  inputId: [
    'input_id', 'name_id', 'id', 'record_id', 'row_id',
  ],
}

export function mapColumns(headers: string[], provider: CsvProvider): ColumnMapping {
  const norm = headers.map(normalize)
  const mapping: ColumnMapping = {}

  if (provider === 'truencoa') {
    return mapTrueNcoa(headers, norm)
  }
  if (provider === 'ncoasource') {
    return mapNcoaSource(headers, norm)
  }
  if (provider === 'chabadcms') {
    return mapChabadCms(headers, norm)
  }

  for (const [field, aliases] of Object.entries(ALIASES)) {
    const idx = norm.findIndex(h => aliases.includes(h))
    if (idx !== -1) {
      (mapping as any)[field] = headers[idx]
    }
  }

  return mapping
}

function mapTrueNcoa(headers: string[], norm: string[]): ColumnMapping {
  const find = (patterns: string[]) => {
    const idx = norm.findIndex(h => patterns.some(p => h.includes(p)))
    return idx !== -1 ? headers[idx] : undefined
  }
  return {
    firstName: find(['input_individual_first_name', 'individual_first_name']),
    lastName: find(['input_individual_last_name', 'individual_last_name']),
    oldAddress: find(['input_address_line_1']),
    oldCity: find(['input_address_city_name']),
    oldState: find(['input_address_state_code']),
    oldZip: find(['input_address_postal_code']),
    newAddress: find(['address_line_1']) && !find(['input_address_line_1']) ? find(['address_line_1']) : headers[norm.findIndex(h => h === 'address_line_1' && h !== norm[norm.indexOf('input_address_line_1')])] || find(['address_line_1']),
    newCity: find(['city_name']),
    newState: find(['state_code']),
    newZip: find(['postal_code']),
    moveType: find(['move_type']),
    recordType: find(['record_type']),
    inputId: find(['input_id', 'name_id']),
  }
}

function mapNcoaSource(headers: string[], norm: string[]): ColumnMapping {
  const find = (patterns: string[]) => {
    const idx = norm.findIndex(h => patterns.some(p => h.includes(p)))
    return idx !== -1 ? headers[idx] : undefined
  }
  return {
    firstName: find(['first_name', 'fname']),
    lastName: find(['last_name', 'lname']),
    oldAddress: find(['address', 'street']),
    oldCity: find(['city']),
    oldState: find(['state']),
    oldZip: find(['zip', 'postal']),
    newAddress: find(['mailto1_address', 'new_address']),
    newCity: find(['mailto1_city', 'new_city']),
    newState: find(['mailto1_state', 'new_state']),
    newZip: find(['mailto1_zip', 'new_zip']),
    moveType: find(['move_type']),
  }
}

function mapChabadCms(headers: string[], norm: string[]): ColumnMapping {
  const find = (patterns: string[]) => {
    const idx = norm.findIndex(h => patterns.some(p => h === p || h.includes(p)))
    return idx !== -1 ? headers[idx] : undefined
  }
  return {
    firstName: find(['first_name']),
    lastName: find(['last_name']),
    oldAddress: find(['address']),
    oldCity: find(['city']),
    oldState: find(['state']),
    oldZip: find(['zip_code', 'zip']),
    newAddress: find(['new_address']),
    newCity: find(['new_city']),
    newState: find(['new_state']),
    newZip: find(['new_zip']),
  }
}

export function validateMapping(mapping: ColumnMapping): string[] {
  const errors: string[] = []
  if (!mapping.firstName && !mapping.lastName) errors.push('No name columns detected')
  if (!mapping.newZip) errors.push('No new zip code column detected - this is required to match movers')
  if (!mapping.oldZip && !mapping.recordType) errors.push('No old zip code column detected')
  return errors
}
