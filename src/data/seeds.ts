export const demoStudent = {
  id: 'demo-samaritan963',
  name: 'Samaritan963',
  tagline: 'A sample student profile showing how progress can stay clear from game to game.',
  focusStatement:
    'A 1:1 chess student whose natural game leans dynamic and active. The coaching job is to sharpen initiative without losing structure.',
  goals: [
    'Understand what kind of positions fit my style best',
    'Convert good positions more calmly in rapid games',
    'Make fewer rushed decisions when the game gets sharp',
  ],
}

export const demoGames = [
  {
    id: 'game-benoni-breakthrough',
    studentId: demoStudent.id,
    coachedSide: 'black' as const,
    pgn: `[Event "rated rapid game"]
[Site "https://lichess.org/H35tBiSB"]
[Date "2020.12.29"]
[Round "-"]
[White "WetTeo"]
[Black "Samaritan963"]
[Result "0-1"]
[GameId "H35tBiSB"]
[UTCDate "2020.12.29"]
[UTCTime "20:16:25"]
[WhiteElo "1938"]
[BlackElo "1927"]
[WhiteRatingDiff "-6"]
[BlackRatingDiff "+32"]
[Variant "Standard"]
[TimeControl "600+0"]
[ECO "A43"]
[Opening "Benoni Defense: Old Benoni"]
[Termination "Normal"]

1. d4 c5 2. d5 d6 3. Nf3 Nf6 4. g3 e6 5. c4 Be7 6. Bg2 O-O 7. Nc3 exd5 8. Nxd5 Nxd5 9. cxd5 Bf5 10. O-O h6 11. Re1 Nd7 12. e4 Bg6 13. Bf1 Bf6 14. Rb1 Bh5 15. Be2 Bg6 16. Bd3 Ne5 17. Nxe5 Bxe5 18. Kg2 f5 19. f4 Bd4 20. exf5 Bxf5 21. Bxf5 Rxf5 22. Be3 Bxe3 23. Rxe3 Qa5 24. a3 c4 25. Re7 Rxd5 26. Qe1 Qxe1 27. Rbxe1 Rd2+ 28. R1e2 Rxe2+ 29. Rxe2 Kf7 30. Kf3 d5 31. Re5 Rd8 32. Ke3 d4+ 33. Kd2 a6 34. Re4 Kf6 35. h4 b5 36. g4 g5 37. hxg5+ hxg5 38. f5 Rd6 39. Kc2 a5 40. b3 c3 41. Kd3 b4 42. axb4 axb4 43. Kc2 d3+ 44. Kc1 d2+ 45. Kd1 c2+ 0-1`,
  },
  {
    id: 'game-grunfeld-pressure',
    studentId: demoStudent.id,
    coachedSide: 'white' as const,
    pgn: `[Event "rated rapid game"]
[Site "https://lichess.org/biiuAnki"]
[Date "2021.01.03"]
[Round "-"]
[White "Samaritan963"]
[Black "mereyyy"]
[Result "1-0"]
[GameId "biiuAnki"]
[UTCDate "2021.01.03"]
[UTCTime "08:10:36"]
[WhiteElo "1991"]
[BlackElo "2002"]
[WhiteRatingDiff "+26"]
[BlackRatingDiff "-5"]
[Variant "Standard"]
[TimeControl "600+0"]
[ECO "D92"]
[Opening "Grünfeld Defense: Three Knights Variation, Hungarian Attack"]
[Termination "Normal"]

1. d4 Nf6 2. c4 d5 3. Nc3 g6 4. Bf4 Bg7 5. Nf3 a6 6. e3 O-O 7. h3 c5 8. Be2 dxc4 9. Bxc4 cxd4 10. Qxd4 Qxd4 11. Nxd4 b5 12. Bb3 Bb7 13. O-O Nbd7 14. Rad1 e5 15. Bg5 exd4 16. exd4 h6 17. Bh4 g5 18. Bg3 Ne4 19. Nd5 Nxg3 20. fxg3 Bxd5 21. Bxd5 Nf6 22. Bxa8 Rxa8 23. Rf5 Ne4 24. Kh2 Rd8 25. d5 Bxb2 26. Re1 Nc5 27. Re7 f6 28. d6 Rxd6 29. Rxc5 Be5 30. Rc8+ 1-0`,
  },
  {
    id: 'game-tarrasch-punish',
    studentId: demoStudent.id,
    coachedSide: 'white' as const,
    pgn: `[Event "rated rapid game"]
[Site "https://lichess.org/gqBCAVlu"]
[Date "2020.12.29"]
[Round "-"]
[White "Samaritan963"]
[Black "Daniel_OFC"]
[Result "1-0"]
[GameId "gqBCAVlu"]
[UTCDate "2020.12.29"]
[UTCTime "20:42:39"]
[WhiteElo "1959"]
[BlackElo "1949"]
[WhiteRatingDiff "+28"]
[BlackRatingDiff "-5"]
[Variant "Standard"]
[TimeControl "600+0"]
[ECO "D32"]
[Opening "Tarrasch Defense"]
[Termination "Normal"]

1. d4 e6 2. c4 d5 3. Nc3 c5 4. dxc5 Bxc5 5. cxd5 exd5 6. Qxd5 Qxd5 7. Nxd5 Bb4+ 8. Nxb4 1-0`,
  },
]
