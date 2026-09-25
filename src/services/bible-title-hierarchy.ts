import type { BibleLanguageId } from './bible-languages'

export interface BookTitleInfo {
  subtitle?: string
  title: string
}

interface TitleDef {
  subtitle?: string
  title: string
}

// 66 books title definitions per language
const TITLES_PT: Record<number, TitleDef> = {
  // Pentateuco (1-5)
  1: { subtitle: 'PRIMEIRO LIVRO DE MOISÉS', title: 'GÊNESIS' },
  2: { subtitle: 'SEGUNDO LIVRO DE MOISÉS', title: 'ÊXODO' },
  3: { subtitle: 'TERCEIRO LIVRO DE MOISÉS', title: 'LEVÍTICO' },
  4: { subtitle: 'QUARTO LIVRO DE MOISÉS', title: 'NÚMEROS' },
  5: { subtitle: 'QUINTO LIVRO DE MOISÉS', title: 'DEUTERONÔMIO' },

  // Históricos (6-18)
  6: { subtitle: 'O LIVRO DE', title: 'JOSUÉ' },
  7: { subtitle: 'O LIVRO DE', title: 'JUÍZES' },
  8: { subtitle: 'O LIVRO DE', title: 'RUTE' },
  9: { subtitle: 'PRIMEIRO LIVRO DE', title: 'SAMUEL' },
  10: { subtitle: 'SEGUNDO LIVRO DE', title: 'SAMUEL' },
  11: { subtitle: 'PRIMEIRO LIVRO DOS', title: 'REIS' },
  12: { subtitle: 'SEGUNDO LIVRO DOS', title: 'REIS' },
  13: { subtitle: 'PRIMEIRO LIVRO DAS', title: 'CRÔNICAS' },
  14: { subtitle: 'SEGUNDO LIVRO DAS', title: 'CRÔNICAS' },
  15: { subtitle: 'O LIVRO DE', title: 'ESDRAS' },
  16: { subtitle: 'O LIVRO DE', title: 'NEEMIAS' },
  17: { subtitle: 'O LIVRO DE', title: 'ESTER' },
  18: { subtitle: 'O LIVRO DE', title: 'JÓ' },

  // Poéticos e Sabedoria (19-22)
  19: { subtitle: 'O LIVRO DOS', title: 'SALMOS' },
  20: { subtitle: 'O LIVRO DE', title: 'PROVÉRBIOS' },
  21: { subtitle: 'O LIVRO DE', title: 'ECLESIASTES' },
  22: { subtitle: 'O', title: 'CÂNTICO DOS CÂNTICOS' },

  // Profetas Maiores (23-27)
  23: { subtitle: 'O LIVRO DO PROFETA', title: 'ISAÍAS' },
  24: { subtitle: 'O LIVRO DO PROFETA', title: 'JEREMIAS' },
  25: { subtitle: 'O LIVRO DE', title: 'LAMENTAÇÕES' },
  26: { subtitle: 'O LIVRO DO PROFETA', title: 'EZEQUIEL' },
  27: { subtitle: 'O LIVRO DO PROFETA', title: 'DANIEL' },

  // Profetas Menores (28-39)
  28: { subtitle: 'O LIVRO DO PROFETA', title: 'OSÉIAS' },
  29: { subtitle: 'O LIVRO DO PROFETA', title: 'JOEL' },
  30: { subtitle: 'O LIVRO DO PROFETA', title: 'AMÓS' },
  31: { subtitle: 'O LIVRO DO PROFETA', title: 'OBADIAS' },
  32: { subtitle: 'O LIVRO DO PROFETA', title: 'JONAS' },
  33: { subtitle: 'O LIVRO DO PROFETA', title: 'MIQUÉIAS' },
  34: { subtitle: 'O LIVRO DO PROFETA', title: 'NAUM' },
  35: { subtitle: 'O LIVRO DO PROFETA', title: 'HABACUQUE' },
  36: { subtitle: 'O LIVRO DO PROFETA', title: 'SOFONIAS' },
  37: { subtitle: 'O LIVRO DO PROFETA', title: 'AGEU' },
  38: { subtitle: 'O LIVRO DO PROFETA', title: 'ZACARIAS' },
  39: { subtitle: 'O LIVRO DO PROFETA', title: 'MALAQUIAS' },

  // Evangelhos (40-43)
  40: { subtitle: 'O EVANGELHO SEGUNDO', title: 'SÃO MATEUS' },
  41: { subtitle: 'O EVANGELHO SEGUNDO', title: 'SÃO MARCOS' },
  42: { subtitle: 'O EVANGELHO SEGUNDO', title: 'SÃO LUCAS' },
  43: { subtitle: 'O EVANGELHO SEGUNDO', title: 'SÃO JOÃO' },

  // Histórico NT (44)
  44: { subtitle: 'O LIVRO DE', title: 'ATOS DOS APÓSTOLOS' },

  // Epístolas Paulinas (45-58)
  45: { subtitle: 'EPÍSTOLA DE PAULO AOS', title: 'ROMANOS' },
  46: { subtitle: 'PRIMEIRA EPÍSTOLA DE PAULO AOS', title: 'CORÍNTIOS' },
  47: { subtitle: 'SEGUNDA EPÍSTOLA DE PAULO AOS', title: 'CORÍNTIOS' },
  48: { subtitle: 'EPÍSTOLA DE PAULO AOS', title: 'GÁLATAS' },
  49: { subtitle: 'EPÍSTOLA DE PAULO AOS', title: 'EFÉSIOS' },
  50: { subtitle: 'EPÍSTOLA DE PAULO AOS', title: 'FILIPENSES' },
  51: { subtitle: 'EPÍSTOLA DE PAULO AOS', title: 'COLOSSENSES' },
  52: { subtitle: 'PRIMEIRA EPÍSTOLA DE PAULO AOS', title: 'TESSALONICENSES' },
  53: { subtitle: 'SEGUNDA EPÍSTOLA DE PAULO AOS', title: 'TESSALONICENSES' },
  54: { subtitle: 'PRIMEIRA EPÍSTOLA DE PAULO A', title: 'TIMÓTEO' },
  55: { subtitle: 'SEGUNDA EPÍSTOLA DE PAULO A', title: 'TIMÓTEO' },
  56: { subtitle: 'EPÍSTOLA DE PAULO A', title: 'TITO' },
  57: { subtitle: 'EPÍSTOLA DE PAULO A', title: 'FILEMOM' },
  58: { subtitle: 'EPÍSTOLA AOS', title: 'HEBREUS' },

  // Epístolas Gerais (59-65)
  59: { subtitle: 'EPÍSTOLA UNIVERSAL DE', title: 'SÃO TIAGO' },
  60: { subtitle: 'PRIMEIRA EPÍSTOLA UNIVERSAL DE', title: 'SÃO PEDRO' },
  61: { subtitle: 'SEGUNDA EPÍSTOLA UNIVERSAL DE', title: 'SÃO PEDRO' },
  62: { subtitle: 'PRIMEIRA EPÍSTOLA UNIVERSAL DE', title: 'SÃO JOÃO' },
  63: { subtitle: 'SEGUNDA EPÍSTOLA DE', title: 'SÃO JOÃO' },
  64: { subtitle: 'TERCEIRA EPÍSTOLA DE', title: 'SÃO JOÃO' },
  65: { subtitle: 'EPÍSTOLA UNIVERSAL DE', title: 'SÃO JUDAS' },

  // Profecia NT (66)
  66: { subtitle: 'A REVELAÇÃO DE JESUS CRISTO', title: 'APOCALIPSE' }
}

const TITLES_EN: Record<number, TitleDef> = {
  1: { subtitle: 'THE FIRST BOOK OF MOSES', title: 'GENESIS' },
  2: { subtitle: 'THE SECOND BOOK OF MOSES', title: 'EXODUS' },
  3: { subtitle: 'THE THIRD BOOK OF MOSES', title: 'LEVITICUS' },
  4: { subtitle: 'THE FOURTH BOOK OF MOSES', title: 'NUMBERS' },
  5: { subtitle: 'THE FIFTH BOOK OF MOSES', title: 'DEUTERONOMY' },
  6: { subtitle: 'THE BOOK OF', title: 'JOSHUA' },
  7: { subtitle: 'THE BOOK OF', title: 'JUDGES' },
  8: { subtitle: 'THE BOOK OF', title: 'RUTH' },
  9: { subtitle: 'THE FIRST BOOK OF', title: 'SAMUEL' },
  10: { subtitle: 'THE SECOND BOOK OF', title: 'SAMUEL' },
  11: { subtitle: 'THE FIRST BOOK OF THE', title: 'KINGS' },
  12: { subtitle: 'THE SECOND BOOK OF THE', title: 'KINGS' },
  13: { subtitle: 'THE FIRST BOOK OF THE', title: 'CHRONICLES' },
  14: { subtitle: 'THE SECOND BOOK OF THE', title: 'CHRONICLES' },
  15: { subtitle: 'THE BOOK OF', title: 'EZRA' },
  16: { subtitle: 'THE BOOK OF', title: 'NEHEMIAH' },
  17: { subtitle: 'THE BOOK OF', title: 'ESTHER' },
  18: { subtitle: 'THE BOOK OF', title: 'JOB' },
  19: { subtitle: 'THE BOOK OF', title: 'PSALMS' },
  20: { subtitle: 'THE', title: 'PROVERBS' },
  21: { subtitle: 'THE BOOK OF', title: 'ECCLESIASTES' },
  22: { subtitle: 'THE', title: 'SONG OF SOLOMON' },
  23: { subtitle: 'THE BOOK OF THE PROPHET', title: 'ISAIAH' },
  24: { subtitle: 'THE BOOK OF THE PROPHET', title: 'JEREMIAH' },
  25: { subtitle: 'THE', title: 'LAMENTATIONS OF JEREMIAH' },
  26: { subtitle: 'THE BOOK OF THE PROPHET', title: 'EZEKIEL' },
  27: { subtitle: 'THE BOOK OF THE PROPHET', title: 'DANIEL' },
  28: { subtitle: 'THE BOOK OF THE PROPHET', title: 'HOSEA' },
  29: { subtitle: 'THE BOOK OF THE PROPHET', title: 'JOEL' },
  30: { subtitle: 'THE BOOK OF THE PROPHET', title: 'AMOS' },
  31: { subtitle: 'THE BOOK OF THE PROPHET', title: 'OBADIAH' },
  32: { subtitle: 'THE BOOK OF THE PROPHET', title: 'JONAH' },
  33: { subtitle: 'THE BOOK OF THE PROPHET', title: 'MICAH' },
  34: { subtitle: 'THE BOOK OF THE PROPHET', title: 'NAHUM' },
  35: { subtitle: 'THE BOOK OF THE PROPHET', title: 'HABAKKUK' },
  36: { subtitle: 'THE BOOK OF THE PROPHET', title: 'ZEPHANIAH' },
  37: { subtitle: 'THE BOOK OF THE PROPHET', title: 'HAGGAI' },
  38: { subtitle: 'THE BOOK OF THE PROPHET', title: 'ZECHARIAH' },
  39: { subtitle: 'THE BOOK OF THE PROPHET', title: 'MALACHI' },
  40: { subtitle: 'THE GOSPEL ACCORDING TO', title: 'SAINT MATTHEW' },
  41: { subtitle: 'THE GOSPEL ACCORDING TO', title: 'SAINT MARK' },
  42: { subtitle: 'THE GOSPEL ACCORDING TO', title: 'SAINT LUKE' },
  43: { subtitle: 'THE GOSPEL ACCORDING TO', title: 'SAINT JOHN' },
  44: { subtitle: 'THE', title: 'ACTS OF THE APOSTLES' },
  45: { subtitle: 'THE EPISTLE OF PAUL TO THE', title: 'ROMANS' },
  46: { subtitle: 'THE FIRST EPISTLE OF PAUL TO THE', title: 'CORINTHIANS' },
  47: { subtitle: 'THE SECOND EPISTLE OF PAUL TO THE', title: 'CORINTHIANS' },
  48: { subtitle: 'THE EPISTLE OF PAUL TO THE', title: 'GALATIANS' },
  49: { subtitle: 'THE EPISTLE OF PAUL TO THE', title: 'EPHESIANS' },
  50: { subtitle: 'THE EPISTLE OF PAUL TO THE', title: 'PHILIPPIANS' },
  51: { subtitle: 'THE EPISTLE OF PAUL TO THE', title: 'COLOSSIANS' },
  52: { subtitle: 'THE FIRST EPISTLE OF PAUL TO THE', title: 'THESSALONIANS' },
  53: { subtitle: 'THE SECOND EPISTLE OF PAUL TO THE', title: 'THESSALONIANS' },
  54: { subtitle: 'THE FIRST EPISTLE OF PAUL TO', title: 'TIMOTHY' },
  55: { subtitle: 'THE SECOND EPISTLE OF PAUL TO', title: 'TIMOTHY' },
  56: { subtitle: 'THE EPISTLE OF PAUL TO', title: 'TITUS' },
  57: { subtitle: 'THE EPISTLE OF PAUL TO', title: 'PHILEMON' },
  58: { subtitle: 'THE EPISTLE TO THE', title: 'HEBREWS' },
  59: { subtitle: 'THE GENERAL EPISTLE OF', title: 'SAINT JAMES' },
  60: { subtitle: 'THE FIRST GENERAL EPISTLE OF', title: 'SAINT PETER' },
  61: { subtitle: 'THE SECOND GENERAL EPISTLE OF', title: 'SAINT PETER' },
  62: { subtitle: 'THE FIRST GENERAL EPISTLE OF', title: 'SAINT JOHN' },
  63: { subtitle: 'THE SECOND EPISTLE OF', title: 'SAINT JOHN' },
  64: { subtitle: 'THE THIRD EPISTLE OF', title: 'SAINT JOHN' },
  65: { subtitle: 'THE GENERAL EPISTLE OF', title: 'SAINT JUDE' },
  66: { subtitle: 'THE REVELATION OF JESUS CHRIST', title: 'REVELATION' }
}

const TITLES_ES: Record<number, TitleDef> = {
  1: { subtitle: 'EL PRIMER LIBRO DE MOISÉS', title: 'GÉNESIS' },
  2: { subtitle: 'EL SEGUNDO LIBRO DE MOISÉS', title: 'ÉXODO' },
  3: { subtitle: 'EL TERCER LIBRO DE MOISÉS', title: 'LEVÍTICO' },
  4: { subtitle: 'EL CUARTO LIBRO DE MOISÉS', title: 'NÚMEROS' },
  5: { subtitle: 'EL QUINTO LIBRO DE MOISÉS', title: 'DEUTERONOMIO' },
  6: { subtitle: 'EL LIBRO DE', title: 'JOSUÉ' },
  7: { subtitle: 'EL LIBRO DE', title: 'JUECES' },
  8: { subtitle: 'EL LIBRO DE', title: 'RUT' },
  9: { subtitle: 'EL PRIMER LIBRO DE', title: 'SAMUEL' },
  10: { subtitle: 'EL SEGUNDO LIBRO DE', title: 'SAMUEL' },
  11: { subtitle: 'EL PRIMER LIBRO DE LOS', title: 'REYES' },
  12: { subtitle: 'EL SEGUNDO LIBRO DE LOS', title: 'REYES' },
  13: { subtitle: 'EL PRIMER LIBRO DE LAS', title: 'CRÓNICAS' },
  14: { subtitle: 'EL SEGUNDO LIBRO DE LAS', title: 'CRÓNICAS' },
  15: { subtitle: 'EL LIBRO DE', title: 'ESDRAS' },
  16: { subtitle: 'EL LIBRO DE', title: 'NEHEMÍAS' },
  17: { subtitle: 'EL LIBRO DE', title: 'ESTER' },
  18: { subtitle: 'EL LIBRO DE', title: 'JOB' },
  19: { subtitle: 'EL LIBRO DE LOS', title: 'SALMOS' },
  20: { subtitle: 'EL LIBRO DE', title: 'PROVERBIOS' },
  21: { subtitle: 'EL LIBRO DE', title: 'ECLESIASTÉS' },
  22: { subtitle: 'EL', title: 'CANTAR DE LOS CANTARES' },
  23: { subtitle: 'EL LIBRO DEL PROFETA', title: 'ISAÍAS' },
  24: { subtitle: 'EL LIBRO DEL PROFETA', title: 'JEREMÍAS' },
  25: { subtitle: 'EL LIBRO DE', title: 'LAMENTACIONES' },
  26: { subtitle: 'EL LIBRO DEL PROFETA', title: 'EZEQUIEL' },
  27: { subtitle: 'EL LIBRO DEL PROFETA', title: 'DANIEL' },
  28: { subtitle: 'EL LIBRO DEL PROFETA', title: 'OSEAS' },
  29: { subtitle: 'EL LIBRO DEL PROFETA', title: 'JOEL' },
  30: { subtitle: 'EL LIBRO DEL PROFETA', title: 'AMÓS' },
  31: { subtitle: 'EL LIBRO DEL PROFETA', title: 'ABDÍAS' },
  32: { subtitle: 'EL LIBRO DEL PROFETA', title: 'JONÁS' },
  33: { subtitle: 'EL LIBRO DEL PROFETA', title: 'MIQUEAS' },
  34: { subtitle: 'EL LIBRO DEL PROFETA', title: 'NAHÚM' },
  35: { subtitle: 'EL LIBRO DEL PROFETA', title: 'HABACUC' },
  36: { subtitle: 'EL LIBRO DEL PROFETA', title: 'SOFONÍAS' },
  37: { subtitle: 'EL LIBRO DEL PROFETA', title: 'HAGEO' },
  38: { subtitle: 'EL LIBRO DEL PROFETA', title: 'ZACARÍAS' },
  39: { subtitle: 'EL LIBRO DEL PROFETA', title: 'MALAQUÍAS' },
  40: { subtitle: 'EL EVANGELIO SEGÚN', title: 'SAN MATEO' },
  41: { subtitle: 'EL EVANGELIO SEGÚN', title: 'SAN MARCOS' },
  42: { subtitle: 'EL EVANGELIO SEGÚN', title: 'SAN LUCAS' },
  43: { subtitle: 'EL EVANGELIO SEGÚN', title: 'SAN JUAN' },
  44: { subtitle: 'EL LIBRO DE LOS', title: 'HECHOS DE LOS APÓSTOLES' },
  45: { subtitle: 'EPÍSTOLA DE PABLO A LOS', title: 'ROMANOS' },
  46: { subtitle: 'PRIMERA EPÍSTOLA DE PABLO A LOS', title: 'CORINTIOS' },
  47: { subtitle: 'SEGUNDA EPÍSTOLA DE PABLO A LOS', title: 'CORINTIOS' },
  48: { subtitle: 'EPÍSTOLA DE PABLO A LOS', title: 'GÁLATAS' },
  49: { subtitle: 'EPÍSTOLA DE PABLO A LOS', title: 'EFESIOS' },
  50: { subtitle: 'EPÍSTOLA DE PABLO A LOS', title: 'FILIPENSES' },
  51: { subtitle: 'EPÍSTOLA DE PABLO A LOS', title: 'COLOSENSES' },
  52: { subtitle: 'PRIMERA EPÍSTOLA DE PABLO A LOS', title: 'TESALONICENSES' },
  53: { subtitle: 'SEGUNDA EPÍSTOLA DE PABLO A LOS', title: 'TESALONICENSES' },
  54: { subtitle: 'PRIMERA EPÍSTOLA DE PABLO A', title: 'TIMOTEO' },
  55: { subtitle: 'SEGUNDA EPÍSTOLA DE PABLO A', title: 'TIMOTEO' },
  56: { subtitle: 'EPÍSTOLA DE PABLO A', title: 'TITO' },
  57: { subtitle: 'EPÍSTOLA DE PABLO A', title: 'FILEMÓN' },
  58: { subtitle: 'EPÍSTOLA A LOS', title: 'HEBREOS' },
  59: { subtitle: 'EPÍSTOLA UNIVERSAL DE', title: 'SANTIAGO' },
  60: { subtitle: 'PRIMERA EPÍSTOLA UNIVERSAL DE', title: 'SAN PEDRO' },
  61: { subtitle: 'SEGUNDA EPÍSTOLA UNIVERSAL DE', title: 'SAN PEDRO' },
  62: { subtitle: 'PRIMERA EPÍSTOLA UNIVERSAL DE', title: 'SAN JUAN' },
  63: { subtitle: 'SEGUNDA EPÍSTOLA DE', title: 'SAN JUAN' },
  64: { subtitle: 'TERCERA EPÍSTOLA DE', title: 'SAN JUAN' },
  65: { subtitle: 'EPÍSTOLA UNIVERSAL DE', title: 'SAN JUDAS' },
  66: { subtitle: 'LA REVELACIÓN DE JESUCRISTO', title: 'APOCALIPSIS' }
}

const REGISTRY: Record<string, Record<number, TitleDef>> = {
  'pt-BR': TITLES_PT,
  'en-US': TITLES_EN,
  es: TITLES_ES
}

/**
 * Returns the hierarchical title information (upper subtitle + main book title)
 * for a given book of the Bible.
 */
export function getBookTitleHierarchy(
  languageId: BibleLanguageId,
  bookId: number,
  fallbackBookName: string
): BookTitleInfo {
  const langTable = REGISTRY[languageId] || TITLES_PT
  const def = langTable[bookId] || TITLES_PT[bookId]

  if (def) {
    return {
      subtitle: def.subtitle,
      title: def.title
    }
  }

  return {
    title: fallbackBookName.toUpperCase()
  }
}
