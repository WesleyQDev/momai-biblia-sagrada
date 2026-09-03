# Automações da Extensão Bíblia Sagrada (`momai-biblia-sagrada`)

Este documento detalha todos os gatilhos (**Triggers**), ações (**Actions**) e cenários de fluxo de automação suportados pela extensão `momai-biblia-sagrada` no ecossistema da MomAI.

---

## 1. Triggers (Gatilhos de Evento)

Os triggers são eventos emitidos em tempo real pelo worker persistente (`runtime.ts`) ou pela UI da extensão para o barramento de eventos da MomAI.

| Evento | Label | Descrição | Payload dos Dados |
|---|---|---|---|
| `bible_daily_verse` | Versículo Diário | Disparado quando um novo versículo devocional é solicitado ou sorteado para o dia | `{ reference: string, text: string, book: string, chapter: number, verse: number }` |
| `bible_reading_progress` | Progresso de Leitura Bíblica | Disparado quando o leitor navega e progride entre capítulos | `{ book: string, chapter: number, testament: "AT" \| "NT" }` |
| `bible_bookmark_created` | Marcador Criado | Disparado quando o usuário adiciona um novo marcador | `{ reference: string, text: string, book: string }` |
| `bible_bookmark_removed` | Marcador Removido | Disparado quando um marcador é removido | `{ bookmarkId: string, reference: string }` |

---

## 2. Actions (Ações Executáveis)

As ações correspondem às ferramentas registradas e despachadas para o assistente MomAI e para o motor de automações do host.

### `search_bible`
- **Descrição**: Pesquisa passagens, palavras-chave ou frases na Bíblia Almeida.
- **Entrada (Inputs)**:
  ```json
  {
    "query": "amor de Deus",
    "testament": "NT",
    "limit": 5
  }
  ```
- **Saída (Output)**:
  ```json
  {
    "ok": true,
    "total": 5,
    "results": [
      {
        "id": "rm-8-39",
        "bookName": "Romanos",
        "chapter": 8,
        "verse": 39,
        "text": "nem a altura, nem a profundidade..."
      }
    ]
  }
  ```

### `get_verse`
- **Descrição**: Retorna o texto literal e exato de um versículo.
- **Entrada (Inputs)**:
  ```json
  {
    "book": "João",
    "chapter": 3,
    "verse": 16
  }
  ```
- **Saída (Output)**:
  ```json
  {
    "ok": true,
    "reference": "João 3:16",
    "text": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."
  }
  ```

### `get_random_verse`
- **Descrição**: Retorna um versículo completo e inspirador.
- **Entrada (Inputs)**:
  ```json
  {
    "testament": "ALL"
  }
  ```
- **Saída (Output)**:
  ```json
  {
    "ok": true,
    "reference": "Salmos 23:1",
    "text": "O Senhor é o meu pastor; nada me faltará."
  }
  ```

### `add_bookmark`
- **Descrição**: Marca um versículo para estudo.
- **Entrada (Inputs)**:
  ```json
  {
    "book": "Salmos",
    "chapter": 91,
    "verse": 1,
    "note": "Versículo de proteção"
  }
  ```

---

## 3. Exemplos de Fluxos de Automação

### Fluxo 1: Devocional Matinal Diário
1. **Trigger**: Cron/Horário da MomAI (ex: 07:00 todos os dias).
2. **Action**: `momai-biblia-sagrada.get_random_verse`.
3. **Action Subsequente**: MomAI envia notificação no desktop ou mensagem de bom dia com o texto do versículo.

### Fluxo 2: Registro de Estudo ao Marcar Versículo
1. **Trigger**: `bible_bookmark_created` (usuário marcou um versículo na leitura).
2. **Condição**: Se o livro for do Novo Testamento.
3. **Action**: MomAI pode registrar o trecho nas notas de estudo ou sintetizar um comentário devocional.

### Fluxo 3: Lembrete de Continuação de Leitura
1. **Trigger**: Usuário inicia a sessão da MomAI.
2. **Action**: `momai-biblia-sagrada.get_last_reading`.
3. **Apresentação**: O assistente informa onde o usuário parou: *"Olá Wesley! Sua última leitura bíblica foi em Romanos capítulo 8. Gostaria de continuar hoje?"*.
