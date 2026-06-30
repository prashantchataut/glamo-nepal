import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError, withTransaction } from './turso-helpers'
import type { Client, InStatement, ResultSet, Transaction } from '@libsql/client/web'

function rejectWith(error: Error): Promise<never> {
  const p = Promise.reject(error)
  p.catch(() => {})
  return p
}

function makeResultSet(overrides: Partial<ResultSet> = {}): ResultSet {
  return {
    rows: [],
    columns: [],
    columnTypes: [],
    rowsAffected: 1,
    lastInsertRowid: undefined,
    ...overrides,
  } as ResultSet
}

function makeMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    execute: vi.fn().mockResolvedValue(makeResultSet()),
    batch: vi.fn().mockResolvedValue([makeResultSet()]),
    executeMultiple: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    closed: false,
    ...overrides,
  } as unknown as Transaction
}

function makeMockClient(tx: Transaction): Client {
  return {
    transaction: vi.fn().mockResolvedValue(tx),
    execute: vi.fn().mockResolvedValue(makeResultSet()),
    batch: vi.fn().mockResolvedValue([makeResultSet()]),
    executeMultiple: vi.fn().mockResolvedValue(undefined),
    migrate: vi.fn().mockResolvedValue([makeResultSet()]),
    sync: vi.fn().mockResolvedValue({} as any),
    close: vi.fn(),
    closed: false,
    protocol: 'http',
  } as unknown as Client
}

describe('withTransaction', () => {

  it('commits the transaction and returns the body result', async () => {
    const tx = makeMockTransaction()
    const db = makeMockClient(tx)

    const result = await withTransaction(db, async (client) => {
      await client.execute({ sql: 'INSERT INTO test VALUES (?)', args: [1] })
      return 'ok'
    })

    expect(result).toBe('ok')
    expect(tx.commit).toHaveBeenCalledTimes(1)
    expect(tx.rollback).not.toHaveBeenCalled()
    expect(tx.close).toHaveBeenCalledTimes(1)
  })

  it('rolls back and rethrows non-AppError failures without retry', async () => {
    const tx = makeMockTransaction()
    const db = makeMockClient(tx)
    const bodyError = new Error('boom')

    await expect(
      withTransaction(db, async () => {
        throw bodyError
      })
    ).rejects.toThrow('boom')

    expect(tx.commit).not.toHaveBeenCalled()
    expect(tx.rollback).toHaveBeenCalledTimes(1)
    expect(tx.close).toHaveBeenCalledTimes(1)
    expect(db.transaction).toHaveBeenCalledTimes(1)
  })

  it('does not retry on AppError and rethrows immediately', async () => {
    const tx = makeMockTransaction()
    const db = makeMockClient(tx)
    const appError = new AppError('INSUFFICIENT_STOCK', 409, 'INSUFFICIENT_STOCK')

    await expect(
      withTransaction(db, async () => {
        throw appError
      })
    ).rejects.toThrow(appError)

    expect(tx.rollback).toHaveBeenCalledTimes(1)
    expect(db.transaction).toHaveBeenCalledTimes(1)
  })

  it('retries transient transaction lifecycle failures and succeeds on the next attempt', async () => {
    const transientError = new Error('SQLITE_UNKNOWN: cannot commit - no transaction is active')
    const tx1 = makeMockTransaction({ commit: vi.fn().mockImplementation(() => rejectWith(transientError)) })
    const tx2 = makeMockTransaction()
    const db = makeMockClient(tx1)
    vi.mocked(db.transaction)
      .mockResolvedValueOnce(tx1)
      .mockResolvedValueOnce(tx2)

    await expect(withTransaction(db, async () => 'ok')).resolves.toBe('ok')
    expect(tx1.commit).toHaveBeenCalledTimes(1)
    expect(tx2.commit).toHaveBeenCalledTimes(1)
    expect(tx1.rollback).toHaveBeenCalledTimes(1)
    expect(tx2.rollback).not.toHaveBeenCalled()
  })

  it('gives up after MAX retries and throws the last error', async () => {
    const transientError = new Error('SQLITE_BUSY')
    const tx = makeMockTransaction({ commit: vi.fn().mockImplementation(() => rejectWith(transientError)) })
    const db = makeMockClient(tx)

    await expect(withTransaction(db, async () => 'ok')).rejects.toThrow('SQLITE_BUSY')
    expect(db.transaction).toHaveBeenCalledTimes(2)
    expect(tx.commit).toHaveBeenCalledTimes(2)
  })
})
