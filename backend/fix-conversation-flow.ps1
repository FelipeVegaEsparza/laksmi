$content = Get-Content backend/src/services/chatbot/ConversationFlow.ts -Raw

# Reemplazar el método handleCategorySelection
$pattern = '(?s)(private static handleCategorySelection\(message: string, context: StateContext\): FlowResult \{\s+const \{ services, categories, chatContext \} = context;\s+const num = this\.extractNumber\(message\);)\s+// Solo manejar.*?if \(this\.isFreeQuery\(message\)\)'

$replacement = '$1

    if (this.isFreeQuery(message))'

$content = $content -replace $pattern, $replacement

Set-Content -Path backend/src/services/chatbot/ConversationFlow.ts -Value $content -NoNewline
