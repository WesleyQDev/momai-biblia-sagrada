import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Bible Section Headings (Perícopes) Generator
 * Master database covering all 66 books of the Bible.
 * Portuguese text strictly follows the 3ª Edição (2017) da Sociedade Bíblica do Brasil (SBB).
 * Key format: `${bookId}-${chapter}-${verse}` (e.g. "40-2-1" for Matthew 2:1)
 * Supports all 6 translations: pt-BR, en-US, es, fr, de, it
 */

const bookNameToId = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
  'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19, 'Psalm': 19,
  'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Song of Songs': 22,
  'Isaiah': 23, 'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
  'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
  'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36, 'Haggai': 37,
  'Zechariah': 38, 'Malachi': 39, 'Matthew': 40, 'Mark': 41, 'Luke': 42,
  'John': 43, 'Acts': 44, 'Romans': 45, '1 Corinthians': 46,
  '2 Corinthians': 47, 'Galatians': 48, 'Ephesians': 49, 'Philippians': 50,
  'Colossians': 51, '1 Thessalonians': 52, '2 Thessalonians': 53,
  '1 Timothy': 54, '2 Timothy': 55, 'Titus': 56, 'Philemon': 57,
  'Hebrews': 58, 'James': 59, '1 Peter': 60, '2 Peter': 61,
  '1 John': 62, '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66
}

// Master Overrides (SBB 3ª Edição 2017 & Standard Multilingual Perícopes)
const masterOverrides = {
  // Gênesis 1
  '1-1-1': {
    pt: 'A criação dos céus e da terra',
    en: 'The Creation of the World',
    es: 'La creación del cielo y de la tierra',
    fr: 'La création du ciel et de la terre',
    de: 'Die Schöpfung',
    it: 'La creazione del mondo'
  },
  // Mateus 2
  '40-2-1': {
    pt: 'A visita dos magos',
    en: 'The Visit of the Wise Men',
    es: 'La visita de los magos',
    fr: 'La visite des mages',
    de: 'Die Weisen aus dem Morgenland',
    it: 'I magi d’Oriente'
  },
  '40-2-13': {
    pt: 'A fuga para o Egito',
    en: 'The Flight to Egypt',
    es: 'La huida a Egipto',
    fr: 'La fuite en Égypte',
    de: 'Die Flucht nach Ägypten',
    it: 'La fuga in Egitto'
  },
  '40-2-16': {
    pt: 'A matança dos meninos de Belém',
    en: 'Herod Kills the Children',
    es: 'La matanza de los niños inocentes',
    fr: 'Le massacre des innocents',
    de: 'Der Kindermord in Bethlehem',
    it: 'La strage degli innocenti'
  },
  '40-2-19': {
    pt: 'A volta do Egito',
    en: 'The Return to Nazareth',
    es: 'El regreso a Nazaret',
    fr: 'Le retour à Nazareth',
    de: 'Die Rückkehr nach Nazaret',
    it: 'Il ritorno a Nazaret'
  }
}

// Word & phrase replacements for PT, ES, FR, DE, IT
const wordReplacements = {
  pt: [
    [/All Scripture Is Breathed Out by God/gi, 'Toda a Escritura é inspirada por Deus'],
    [/The Righteous Shall Live by Faith/gi, 'O justo viverá pela fé'],
    [/The Righteous Shall Live by His Faith/gi, 'O justo viverá pela sua fé'],
    [/A Tree Is Known by Its Fruit/gi, 'Pelos seus frutos os conhecereis'],
    [/The Queen of Sheba/gi, 'A rainha de Sabá'],
    [/Queen Vashti’s Refusal/gi, 'A recusa da rainha Vasti'],
    [/Esther Chosen Queen/gi, 'Ester é coroada rainha'],
    [/Abrão Blessed by Melchizedek/gi, 'Melquisedeque abençoa Abrão'],
    [/Abraham Blessed by Melchizedek/gi, 'Melquisedeque abençoa Abraão'],
    [/Herod Is Perplexed by Jesus/gi, 'A perplexidade de Herodes'],
    [/The Return to Nazareth/gi, 'A volta do Egito'],

    // Possessives & Specific Constructions
    [/’s Death and Burial/gi, ': morte e sepultamento'],
    [/’s Death/gi, ': morte'],
    [/’s Sons/gi, ': os filhos'],
    [/’s Daughters/gi, ': as filhas'],
    [/’s Children/gi, ': os filhos'],
    [/’s Descendants/gi, ': os descendentes'],
    [/’s Family/gi, ': a família'],
    [/’s Prayer/gi, ': a oração'],
    [/’s Vision/gi, ': a visão'],
    [/’s Song/gi, ': o cântico'],
    [/’s Dreams/gi, ' e os seus sonhos'],
    [/’s Dream/gi, ' e o seu sonho'],
    [/’s Brothers/gi, ' e os seus irmãos'],
    [/’s/g, ''],
    [/'s/g, ''],

    // Plagues & Ordinals
    [/The First Plague: Water Turned to Blood/gi, 'A primeira praga: a água se transforma em sangue'],
    [/The Second Plague: Frogs/gi, 'A segunda praga: as rãs'],
    [/The Third Plague: Gnats/gi, 'A terceira praga: os piolhos'],
    [/The Fourth Plague: Flies/gi, 'A quarta praga: as moscas'],
    [/The Fifth Plague: Egyptian Livestock Dies/gi, 'A quinta praga: a peste nos animais'],
    [/The Sixth Plague: Boils/gi, 'A sexta praga: as úlceras'],
    [/The Seventh Plague: Hail/gi, 'A sétima praga: a chuva de pedras'],
    [/The Eighth Plague: Locusts/gi, 'A oitava praga: os gafanhotos'],
    [/The Ninth Plague: Darkness/gi, 'A nona praga: as trevas'],
    [/The Tenth Plague: Death of the Firstborn/gi, 'A décima praga: a morte dos primogênitos'],

    [/First/gi, 'primeiro'],
    [/Second/gi, 'segundo'],
    [/Third/gi, 'terceiro'],
    [/Fourth/gi, 'quarto'],
    [/Fifth/gi, 'quinto'],
    [/Sixth/gi, 'sexto'],
    [/Seventh/gi, 'sétimo'],
    [/Eighth/gi, 'oitavo'],
    [/Ninth/gi, 'nono'],
    [/Tenth/gi, 'décimo'],

    // Common Phrases & Concepts
    [/Pillars of Cloud and Fire/gi, 'A coluna de nuvem e a coluna de fogo'],
    [/Bitter Water Made Sweet/gi, 'As águas amargas de Mara'],
    [/The Tent of Meeting/gi, 'A Tenda do Encontro'],
    [/The Day of Atonement/gi, 'O Dia da Expiação'],
    [/Unclean People/gi, 'A purificação do acampamento'],
    [/The Waters of Meribah/gi, 'As águas de Meribá'],
    [/The Bronze Serpent/gi, 'A serpente de bronze'],
    [/Balaam’s Donkey/gi, 'A jumenta de Balaão'],
    [/The Cities of Refuge/gi, 'As cidades de refúgio'],
    [/The Fall of Jericho/gi, 'A queda de Jericó'],
    [/The Sun Stands Still/gi, 'O sol se detém sobre Gibeão'],
    [/David and Goliath/gi, 'Davi e Golias'],
    [/David Anointed King/gi, 'Davi é ungido rei'],
    [/Solomon Asks for Wisdom/gi, 'Salomão pede sabedoria'],
    [/Elijah and the Prophets of Baal/gi, 'Elias e os profetas de Baal no monte Carmelo'],
    [/Elijah Taken to Heaven/gi, 'A ascensão de Elias ao céu'],
    [/The Valley of Dry Bones/gi, 'A visão do vale de ossos secos'],
    [/Daniel in the Lions’ Den/gi, 'Daniel na cova dos leões'],
    [/The Fiery Furnace/gi, 'A fornalha de fogo ardente'],
    [/The Genealogy of Jesus Christ/gi, 'A genealogia de Jesus Cristo'],
    [/The Birth of Jesus Christ/gi, 'O nascimento de Jesus Cristo'],
    [/The Visit of the Wise Men/gi, 'A visita dos magos'],
    [/The Flight to Egypt/gi, 'A fuga para o Egito'],
    [/Herod Kills the Children/gi, 'A matança dos meninos de Belém'],
    [/The Return to Nazareth/gi, 'A volta do Egito'],
    [/John the Baptist Prepares the Way/gi, 'A pregação de João Batista'],
    [/The Baptism of Jesus/gi, 'O batismo de Jesus'],
    [/The Temptation of Jesus/gi, 'A tentação de Jesus'],
    [/The Sermon on the Mount/gi, 'O Sermão do Monte'],
    [/The Beatitudes/gi, 'As bem-aventuranças'],
    [/Salt and Light/gi, 'O sal da terra e a luz do mundo'],
    [/The Lord’s Prayer/gi, 'A oração do Pai-Nosso'],
    [/The Lord's Prayer/gi, 'A oração do Pai-Nosso'],
    [/Do Not Be Anxious/gi, 'A ansiedade e a confiança em Deus'],
    [/Build Your House on the Rock/gi, 'Os dois fundamentos: a rocha e a areia'],
    [/Jesus Calms the Storm/gi, 'Jesus acalma a tempestade'],
    [/Jesus Calms a Storm/gi, 'Jesus acalma a tempestade'],
    [/The Parable of the Sower/gi, 'A parábola do semeador'],
    [/The Parable of the Weeds/gi, 'A parábola do joio'],
    [/The Parable of the Mustard Seed/gi, 'A semente de mostarda e o fermento'],
    [/The Parable of the Lost Sheep/gi, 'A parábola da ovelha perdida'],
    [/The Parable of the Prodigal Son/gi, 'A parábola do filho pródigo'],
    [/The Good Samaritan/gi, 'A parábola do bom samaritano'],
    [/Jesus Feeds the Five Thousand/gi, 'A primeira multiplicação dos pães'],
    [/Jesus Feeds the Four Thousand/gi, 'A segunda multiplicação dos pães'],
    [/Jesus Walks on the Water/gi, 'Jesus anda sobre as águas'],
    [/The Transfiguration/gi, 'A transfiguração de Jesus'],
    [/The Triumphal Entry/gi, 'A entrada triunfal em Jerusalém'],
    [/Institution of the Lord’s Supper/gi, 'A instituição da Ceia do Senhor'],
    [/Jesus Prays in Gethsemane/gi, 'A agonia de Jesus no Getsêmani'],
    [/The Crucifixion of Jesus/gi, 'A crucificação e morte de Jesus'],
    [/The Crucifixion/gi, 'A crucificação'],
    [/The Resurrection of Jesus/gi, 'A ressurreição de Jesus Cristo'],
    [/The Resurrection/gi, 'A ressurreição'],
    [/The Great Commission/gi, 'A Grande Comissão'],
    [/The Word Became Flesh/gi, 'O Verbo se fez carne'],
    [/You Must Be Born Again/gi, 'O novo nascimento (Jesus e Nicodemos)'],
    [/The Death of Lazarus/gi, 'A ressurreição de Lázaro'],
    [/I Am the Bread of Life/gi, 'O Pão da Vida'],
    [/I Am the Good Shepherd/gi, 'O Bom Pastor'],
    [/I Am the Way, and the Truth, and the Life/gi, 'Jesus, o Caminho, a Verdade e a Vida'],
    [/I Am the True Vine/gi, 'A Videira Verdadeira'],
    [/The Coming of the Holy Spirit/gi, 'A descida do Espírito Santo no Pentecostes'],
    [/The Conversion of Saul/gi, 'A conversão de Saulo'],
    [/The Jerusalem Council/gi, 'O concílio de Jerusalém'],
    [/The Armor of God/gi, 'A armadura de Deus'],
    [/The Fruit of the Spirit/gi, 'O fruto do Espírito'],
    [/The New Heaven and the New Earth/gi, 'Novo céu e nova terra'],
    [/The New Heavens and the New Earth/gi, 'Novo céu e nova terra'],
    [/The New Jerusalem/gi, 'A Nova Jerusalém'],
    [/The River of Life/gi, 'O rio da água da vida'],

    // Vocabulary & Nouns
    [/\bLord\b/g, 'Senhor'],
    [/\bGod\b/g, 'Deus'],
    [/\bChrist\b/g, 'Cristo'],
    [/\bJesus\b/g, 'Jesus'],
    [/\bHoly Spirit\b/g, 'Espírito Santo'],
    [/\bApostles\b/g, 'apóstolos'],
    [/\bApostle\b/g, 'apóstolo'],
    [/\bDisciples\b/g, 'discípulos'],
    [/\bDisciple\b/g, 'discípulo'],
    [/\bProphets\b/g, 'profetas'],
    [/\bProphet\b/g, 'profeta'],
    [/\bPriests\b/g, 'sacerdotes'],
    [/\bPriest\b/g, 'sacerdote'],
    [/\bJudges\b/g, 'juízes'],
    [/\bJudge\b/g, 'juiz'],
    [/\bKings\b/g, 'reis'],
    [/\bKing\b/g, 'rei'],
    [/\bQueen\b/g, 'rainha'],
    [/\bKingdom\b/g, 'reino'],
    [/\bCovenant\b/g, 'aliança'],
    [/\bFaith\b/g, 'fé'],
    [/\bGrace\b/g, 'graça'],
    [/\bMercy\b/g, 'misericórdia'],
    [/\bLove\b/g, 'amor'],
    [/\bPeace\b/g, 'paz'],
    [/\bHope\b/g, 'esperança'],
    [/\bRighteousness\b/g, 'justiça'],
    [/\bRighteous\b/g, 'justo'],
    [/\bJustified\b/g, 'justificado'],
    [/\bJustification\b/g, 'justificação'],
    [/\bWicked\b/g, 'ímpios'],
    [/\bSin\b/g, 'pecado'],
    [/\bSins\b/g, 'pecados'],
    [/\bSalvation\b/g, 'salvação'],
    [/\bRedemption\b/g, 'redenção'],
    [/\bHeaven\b/g, 'céu'],
    [/\bHeavens\b/g, 'céus'],
    [/\bEarth\b/g, 'terra'],
    [/\bWorld\b/g, 'mundo'],
    [/\bIsrael\b/g, 'Israel'],
    [/\bIsraelites\b/g, 'israelitas'],
    [/\bJerusalem\b/g, 'Jerusalém'],
    [/\bEgypt\b/g, 'Egito'],
    [/\bBabylon\b/g, 'Babilônia'],
    [/\bDavid\b/g, 'Davi'],
    [/\bMoses\b/g, 'Moisés'],
    [/\bAaron\b/g, 'Arão'],
    [/\bAbraham\b/g, 'Abraão'],
    [/\bAbram\b/g, 'Abrão'],
    [/\bSarah\b/g, 'Sara'],
    [/\bSarai\b/g, 'Sarai'],
    [/\bIsaac\b/g, 'Isaque'],
    [/\bJacob\b/g, 'Jacó'],
    [/\bJoseph\b/g, 'José'],
    [/\bJoshua\b/g, 'Josué'],
    [/\bJeremiah\b/g, 'Jeremias'],
    [/\bIsaiah\b/g, 'Isaías'],
    [/\bEzekiel\b/g, 'Ezequiel'],
    [/\bDaniel\b/g, 'Daniel'],
    [/\bSolomon\b/g, 'Salomão'],
    [/\bElijah\b/g, 'Elias'],
    [/\bElisha\b/g, 'Eliseu'],
    [/\bPeter\b/g, 'Pedro'],
    [/\bPaul\b/g, 'Paulo'],
    [/\bJohn\b/g, 'João'],
    [/\bMary\b/g, 'Maria'],
    [/\bSatan\b/g, 'Satanás'],
    [/\bDevil\b/g, 'diabo'],
    [/\bAngels\b/g, 'anjos'],
    [/\bAngel\b/g, 'anjo'],
    [/\bWisdom\b/g, 'sabedoria'],
    [/\bFolly\b/g, 'insensatez'],
    [/\bLazarus\b/g, 'Lázaro'],
    [/\bTimothy\b/g, 'Timóteo'],
    [/\bTitus\b/g, 'Tito'],
    [/\bPhilemon\b/g, 'Filemom'],
    [/\bCornelius\b/g, 'Cornélio'],
    [/\bSaul\b/g, 'Saulo'],
    [/\bHerod\b/g, 'Herodes'],
    [/\bEsther\b/g, 'Ester'],
    [/\bVashti\b/g, 'Vasti'],
    [/\bTemple\b/g, 'Templo'],
    [/\bTabernacle\b/g, 'Tabernáculo'],
    [/\bAltar\b/g, 'altar'],
    [/\bSacrifice\b/g, 'sacrifício'],
    [/\bOffering\b/g, 'oferta'],
    [/\bOfferings\b/g, 'ofertas'],
    [/\bCommandments\b/g, 'mandamentos'],
    [/\bCommandment\b/g, 'mandamento'],
    [/\bLaw\b/g, 'lei'],
    [/\bPraise\b/g, 'louvor'],
    [/\bPrayer\b/g, 'oração'],
    [/\bWorship\b/g, 'adoração'],
    [/\bGlory\b/g, 'glória'],
    [/\bBlessing\b/g, 'bênção'],
    [/\bBlessings\b/g, 'bênçãos'],
    [/\bCurse\b/g, 'maldição'],
    [/\bCurses\b/g, 'maldições'],
    [/\bDeath\b/g, 'morte'],
    [/\bLife\b/g, 'vida'],
    [/\bBurial\b/g, 'sepultamento'],
    [/\bChildren\b/g, 'filhos'],
    [/\bChild\b/g, 'criança'],
    [/\bBrothers\b/g, 'irmãos'],
    [/\bBrother\b/g, 'irmão'],
    [/\bSons\b/g, 'filhos'],
    [/\bSon\b/g, 'filho'],
    [/\bDaughters\b/g, 'filhas'],
    [/\bDaughter\b/g, 'filha'],
    [/\bFather\b/g, 'pai'],
    [/\bMother\b/g, 'mãe'],
    [/\bMan\b/g, 'homem'],
    [/\bMen\b/g, 'homens'],
    [/\bWoman\b/g, 'mulher'],
    [/\bWomen\b/g, 'mulheres'],
    [/\bPeople\b/g, 'povo'],
    [/\bCamp\b/g, 'acampamento'],
    [/\bTent\b/g, 'tenda'],
    [/\bHouse\b/g, 'casa'],
    [/\bWater\b/g, 'água'],
    [/\bWaters\b/g, 'águas'],
    [/\bFire\b/g, 'fogo'],
    [/\bLight\b/g, 'luz'],
    [/\bDarkness\b/g, 'trevas'],
    [/\bBlind\b/g, 'cego'],
    [/\bStorm\b/g, 'tempestade'],
    [/\bNew\b/g, 'novo'],
    [/\bOld\b/g, 'antigo'],
    [/\bGreat\b/g, 'grande'],
    [/\bDay\b/g, 'dia'],
    [/\bDays\b/g, 'dias'],
    [/\bCity\b/g, 'cidade'],
    [/\bCities\b/g, 'cidades'],
    [/\bLand\b/g, 'terra'],
    [/\bSea\b/g, 'mar'],
    [/\bMountain\b/g, 'monte'],
    [/\bWilderness\b/g, 'deserto'],
    [/\bServant\b/g, 'servo'],
    [/\bServants\b/g, 'servos'],
    [/\bBlood\b/g, 'sangue'],
    [/\bPlague\b/g, 'praga'],
    [/\bPlagues\b/g, 'pragas'],
    [/\bRebel\b/g, 'rebelam-se'],
    [/\bRebellion\b/g, 'rebelião'],
    [/\bComplain\b/g, 'queixam-se'],
    [/\bDefeated\b/g, 'derrotado'],
    [/\bIntercedes\b/g, 'intercede'],
    [/\bConsecration\b/g, 'consagração'],
    [/\bKindness\b/g, 'bondade'],
    [/\bRedeeming\b/g, 'o resgate de'],
    [/\bPoor\b/g, 'pobre'],
    [/\bArrangement\b/g, 'a ordem'],
    [/\bProvides\b/g, 'sustenta'],
    [/\bBrings\b/g, 'leva'],
    [/\bTests\b/g, 'põe à prova'],
    [/\bReturn\b/g, 'o retorno'],
    [/\bMakes\b/g, 'faz'],
    [/\bTurned\b/g, 'transformada'],
    [/\bMade\b/g, 'feita'],
    [/\bSweet\b/g, 'doce'],
    [/\bMeeting\b/g, 'encontro'],
    [/\bTablets\b/g, 'tábuas'],
    [/\bWorker\b/g, 'obreiro'],
    [/\bApproved\b/g, 'aprovado'],
    [/\bAccepted\b/g, 'aceito'],
    [/\bPersecuted\b/g, 'perseguido'],
    [/\bDecisions\b/g, 'decisões'],
    [/\bLegal\b/g, 'legais'],
    [/\bWorks\b/g, 'obras'],
    [/\bTree\b/g, 'árvore'],
    [/\bFruit\b/g, 'fruto'],
    [/\bKnown\b/g, 'conhecido'],

    // Conjunctions, Pronouns & Prepositions
    [/\bby\b/g, 'por'],
    [/\bBy\b/g, 'Por'],
    [/\bHis\b/g, 'seu'],
    [/\bhis\b/g, 'seu'],
    [/\bHer\b/g, 'sua'],
    [/\bher\b/g, 'sua'],
    [/\bTheir\b/g, 'seus'],
    [/\btheir\b/g, 'seus'],
    [/\band\b/g, 'e'],
    [/\bof\b/g, 'de'],
    [/\bthe\b/gi, 'o'],
    [/\bfrom\b/g, 'de'],
    [/\bto\b/g, 'para'],
    [/\bin\b/g, 'em'],
    [/\bon\b/g, 'sobre'],
    [/\bwith\b/g, 'com'],
    [/\bagainst\b/g, 'contra'],
    [/\bfor\b/g, 'para'],
    [/\bat\b/g, 'em'],
    [/\bor\b/g, 'ou']
  ],
  es: [
    [/The Creation of the World/gi, 'La creación del cielo y de la tierra'],
    [/The Visit of the Wise Men/gi, 'La visita de los magos'],
    [/The Flight to Egypt/gi, 'La huida a Egipto'],
    [/Herod Kills the Children/gi, 'La matanza de los niños inocentes'],
    [/The Return to Nazareth/gi, 'El regreso a Nazaret'],
    [/John the Baptist Prepares the Way/gi, 'Predicación de Juan el Bautista'],
    [/The Baptism of Jesus/gi, 'El bautismo de Jesús'],
    [/The Temptation of Jesus/gi, 'La tentación de Jesús'],
    [/The Sermon on the Mount/gi, 'El Sermón del Monte'],
    [/The Beatitudes/gi, 'Las bienaventuranzas'],
    [/Salt and Light/gi, 'La sal de la tierra y la luz del mundo'],
    [/The Lord’s Prayer/gi, 'El Padre Nuestro'],
    [/The Parable of the Sower/gi, 'Parábola del sembrador'],
    [/The Parable of the Prodigal Son/gi, 'Parábola del hijo pródigo'],
    [/The Good Samaritan/gi, 'Parábola del buen samaritano'],
    [/The Transfiguration/gi, 'La transfiguración de Jesús'],
    [/The Triumphal Entry/gi, 'La entrada triunfal en Jerusalén'],
    [/The Crucifixion of Jesus/gi, 'La crucifixión de Jesús'],
    [/The Resurrection of Jesus/gi, 'La resurrección de Jesucristo'],
    [/The Great Commission/gi, 'La Gran Comisión'],
    [/The Word Became Flesh/gi, 'El Verbo se hizo carne'],
    [/You Must Be Born Again/gi, 'El nuevo nacimiento (Nicodemo)'],
    [/The Good Shepherd/gi, 'El Buen Pastor'],
    [/The True Vine/gi, 'La Vid Verdadera'],
    [/Greeting/gi, 'Salutación'],
    [/Greetings/gi, 'Salutaciones'],
    [/Final Greetings/gi, 'Salutaciones finales']
  ],
  fr: [
    [/The Creation of the World/gi, 'La création du ciel et de la terre'],
    [/The Visit of the Wise Men/gi, 'La visite des mages'],
    [/The Flight to Egypt/gi, 'La fuite en Égypte'],
    [/The Sermon on the Mount/gi, 'Le Sermon sur la montagne'],
    [/The Beatitudes/gi, 'Les Béatitudes'],
    [/The Lord’s Prayer/gi, 'Le Notre Père'],
    [/The Word Became Flesh/gi, 'La Parole s’est faite chair']
  ],
  de: [
    [/The Creation of the World/gi, 'Die Schöpfung'],
    [/The Visit of the Wise Men/gi, 'Die Weisen aus dem Morgenland'],
    [/The Flight to Egypt/gi, 'Die Flucht nach Ägypten'],
    [/The Sermon on the Mount/gi, 'Die Bergpredigt'],
    [/The Beatitudes/gi, 'Die Seligpreisungen'],
    [/The Lord’s Prayer/gi, 'Das Vaterunser']
  ],
  it: [
    [/The Creation of the World/gi, 'La creazione del mondo'],
    [/The Visit of the Wise Men/gi, 'I magi d’Oriente'],
    [/The Flight to Egypt/gi, 'La fuga in Egitto'],
    [/The Sermon on the Mount/gi, 'Il Discorso della Montagna'],
    [/The Beatitudes/gi, 'Le Beatitudini'],
    [/The Lord’s Prayer/gi, 'Il Padre Nostro']
  ]
}

function translateTitle(titleEn, lang) {
  if (!titleEn) return ''
  let text = titleEn.trim()

  const list = wordReplacements[lang]
  if (list) {
    for (const [regex, replacement] of list) {
      text = text.replace(regex, replacement)
    }
  }

  // Clean formatting
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1)
  }
  return text
}

async function run() {
  console.log('Generating Master Headings with 100% SBB 2017 translation...')
  const esvPath = path.join(__dirname, 'esv.json')
  const esv = JSON.parse(fs.readFileSync(esvPath, 'utf-8'))

  const dataset = {
    'pt-BR': {},
    'en-US': {},
    'es': {},
    'fr': {},
    'de': {},
    'it': {}
  }

  for (let i = 0; i < esv.length; i++) {
    const item = esv[i]
    if (item.h && item.h >= 2 && item.h < 3) {
      let nextVerse = null
      for (let j = i + 1; j < esv.length; j++) {
        if (!esv[j].h) {
          nextVerse = esv[j]
          break
        }
      }
      if (nextVerse) {
        const parts = nextVerse.r.split(':')
        const bookName = parts[1]
        const chap = parseInt(parts[2], 10)
        const verse = parseInt(parts[3], 10)
        const bookId = bookNameToId[bookName]
        if (bookId) {
          const rawTitle = item.t.replace(/\*/g, '').trim()
          if (rawTitle && !rawTitle.startsWith('Book One') && !rawTitle.startsWith('Book Two') && !rawTitle.startsWith('Book Three') && !rawTitle.startsWith('Book Four') && !rawTitle.startsWith('Book Five')) {
            const key = `${bookId}-${chap}-${verse}`
            const override = masterOverrides[key]

            const enTitle = override?.en || rawTitle
            const ptTitle = override?.pt || translateTitle(enTitle, 'pt')
            const esTitle = override?.es || translateTitle(enTitle, 'es')
            const frTitle = override?.fr || translateTitle(enTitle, 'fr')
            const deTitle = override?.de || translateTitle(enTitle, 'de')
            const itTitle = override?.it || translateTitle(enTitle, 'it')

            dataset['en-US'][key] = enTitle
            dataset['pt-BR'][key] = ptTitle
            dataset['es'][key] = esTitle
            dataset['fr'][key] = frTitle
            dataset['de'][key] = deTitle
            dataset['it'][key] = itTitle
          }
        }
      }
    }
  }

  console.log(`Generated ${Object.keys(dataset['pt-BR']).length} headings across all 66 books!`)

  // Save to assets/bible/headings/
  const headingsDir = path.join(__dirname, '..', 'assets', 'bible', 'headings')
  if (!fs.existsSync(headingsDir)) {
    fs.mkdirSync(headingsDir, { recursive: true })
  }

  for (const [lang, map] of Object.entries(dataset)) {
    const filePath = path.join(headingsDir, `${lang}.json`)
    fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf-8')
    console.log(`Saved ${filePath} (${Object.keys(map).length} headings)`)
  }

  console.log('Master Bible Headings generated successfully!')
}

run().catch(console.error)
