import { Chess } from 'chess.js'
import type { GameOutcome, MaterialSnapshot, MovePhase, ParsedGame, ParsedMove, PlayerSide } from '../../types/coaching'

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
}

function materialFromFen(fen: string): MaterialSnapshot {
  const board = fen.split(' ')[0]
  let white = 0
  let black = 0

  for (const symbol of board) {
    if (symbol === '/') {
      continue
    }

    const value = PIECE_VALUES[symbol.toLowerCase()]
    if (value === undefined) {
      continue
    }

    if (symbol === symbol.toUpperCase()) {
      white += value
    } else {
      black += value
    }
  }

  return {
    white,
    black,
    difference: white - black,
  }
}

function queensPresent(fen: string) {
  const board = fen.split(' ')[0]
  return board.includes('Q') && board.includes('q')
}

function totalMaterial(material: MaterialSnapshot) {
  return material.white + material.black
}

function derivePhase(ply: number, fen: string, material: MaterialSnapshot): MovePhase {
  if (ply <= 20 && queensPresent(fen) && totalMaterial(material) >= 54) {
    return 'opening'
  }

  if (totalMaterial(material) <= 26 || (!queensPresent(fen) && totalMaterial(material) <= 34)) {
    return 'endgame'
  }

  return 'middlegame'
}

function inferCoachedSide(headers: Record<string, string>, studentName?: string): PlayerSide {
  if (studentName && headers.White === studentName) {
    return 'white'
  }

  if (studentName && headers.Black === studentName) {
    return 'black'
  }

  return 'white'
}

function resultForSide(result: string, side: PlayerSide): GameOutcome {
  if (result === '1/2-1/2') {
    return 'draw'
  }

  if (side === 'white') {
    return result === '1-0' ? 'win' : 'loss'
  }

  return result === '0-1' ? 'win' : 'loss'
}

export function materialEdgeForSide(material: MaterialSnapshot, side: PlayerSide) {
  return side === 'white' ? material.difference : material.black - material.white
}

export function parseGame(pgn: string, coachedSide?: PlayerSide, studentName?: string): ParsedGame {
  const chess = new Chess()
  chess.loadPgn(pgn)

  const headers = chess.getHeaders()
  const side = coachedSide ?? inferCoachedSide(headers, studentName)
  const verboseMoves = chess.history({ verbose: true })

  const moves: ParsedMove[] = verboseMoves.map((move, index) => {
    const materialBefore = materialFromFen(move.before)
    const materialAfter = materialFromFen(move.after)

    return {
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      san: move.san,
      lan: move.lan,
      color: move.color,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured,
      promotion: move.promotion,
      flags: move.flags,
      beforeFen: move.before,
      afterFen: move.after,
      isCapture: move.isCapture(),
      isCheck: move.san.includes('+') || move.san.includes('#'),
      isCastle: move.isKingsideCastle() || move.isQueensideCastle(),
      materialBefore,
      materialAfter,
      phase: derivePhase(index + 1, move.after, materialAfter),
    }
  })

  const white = headers.White ?? 'White'
  const black = headers.Black ?? 'Black'
  const selectedPlayer = side === 'white' ? white : black
  const opponent = side === 'white' ? black : white
  const eventBits = [headers.Event, headers.Site, headers.Date].filter(Boolean)

  return {
    title: `${selectedPlayer} vs ${opponent}`,
    eventSummary: eventBits.join(' · '),
    headers,
    moves,
    white,
    black,
    selectedPlayer,
    opponent,
    coachedSide: side,
    opening: headers.Opening ?? headers.ECO ?? 'Unspecified opening',
    result: headers.Result ?? '*',
    outcome: resultForSide(headers.Result ?? '*', side),
  }
}
