import alerts from './alerts'
import common from './common'
import devices from './devices'
import remote from './remote'

const vi: Record<string, string> = { ...common, ...devices, ...remote, ...alerts }

export default vi
