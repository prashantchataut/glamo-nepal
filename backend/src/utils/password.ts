import bcrypt from 'bcryptjs'

const DEFAULT_ROUNDS = 12

export async function hashPassword(
  password: string,
  rounds: number = DEFAULT_ROUNDS
): Promise<string> {
  const salt = await bcrypt.genSalt(rounds)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}