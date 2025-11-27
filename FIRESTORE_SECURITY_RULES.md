# Firestore Security Rules

Para garantir a segurança do sistema de autenticação, você deve configurar as seguintes regras no Firebase Console.

## Como Configurar

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto (isac-cbd0a)
3. Vá em **Firestore Database** → **Rules**
4. Copie e cole as regras abaixo
5. Clique em **Publish**

## Regras de Segurança Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Regras para a coleção de usuários
    match /users/{userId} {
      // Permitir leitura para usuários autenticados
      allow read: if request.auth != null;

      // Permitir criação apenas se:
      // 1. O usuário está autenticado
      // 2. O ID do documento corresponde ao UID do usuário autenticado
      // 3. Os campos obrigatórios estão presentes
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.keys().hasAll(['uin', 'nickname', 'email', 'status'])
                    && request.resource.data.uin == request.auth.uid
                    && request.resource.data.email == request.auth.token.email;

      // Permitir atualização apenas se:
      // 1. O usuário está autenticado
      // 2. O usuário está atualizando seu próprio documento
      // 3. Não pode alterar UIN ou email
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.uin == resource.data.uin
                    && request.resource.data.email == resource.data.email;

      // Não permitir exclusão de usuários via cliente
      allow delete: if false;
    }

    // Regras para a coleção de mensagens
    match /messages/{messageId} {
      // Permitir leitura apenas se o usuário é o remetente ou destinatário
      allow read: if request.auth != null
                  && (resource.data.senderUin == request.auth.uid
                      || resource.data.receiverUin == request.auth.uid);

      // Permitir criação apenas se:
      // 1. O usuário está autenticado
      // 2. O senderUin corresponde ao UID do usuário autenticado
      // 3. Os campos obrigatórios estão presentes
      allow create: if request.auth != null
                    && request.resource.data.senderUin == request.auth.uid
                    && request.resource.data.keys().hasAll(['senderUin', 'receiverUin', 'text', 'timestamp'])
                    && request.resource.data.text is string
                    && request.resource.data.text.size() > 0
                    && request.resource.data.text.size() <= 5000; // Limite de 5000 caracteres

      // Permitir atualização apenas do campo 'read' e apenas pelo destinatário
      allow update: if request.auth != null
                    && request.auth.uid == resource.data.receiverUin
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);

      // Não permitir exclusão de mensagens
      allow delete: if false;
    }

    // Bloquear acesso a todas as outras coleções
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Explicação das Regras

### Coleção `users`

- **Leitura**: Qualquer usuário autenticado pode ver outros usuários (necessário para a lista de contatos)
- **Criação**: Apenas o próprio usuário pode criar seu documento, e deve usar seu UID como ID do documento
- **Atualização**: Apenas o próprio usuário pode atualizar seu documento, mas não pode alterar UIN ou email
- **Exclusão**: Não permitida (segurança)

### Coleção `messages`

- **Leitura**: Apenas o remetente e destinatário podem ler a mensagem
- **Criação**: Apenas o remetente pode criar mensagens, e o senderUin deve corresponder ao seu UID
- **Atualização**: Apenas o destinatário pode marcar mensagens como lidas
- **Exclusão**: Não permitida (histórico de mensagens)

## Configuração de Autenticação

Também é necessário habilitar o provedor de autenticação Email/Password:

1. No Firebase Console, vá em **Authentication** → **Sign-in method**
2. Clique em **Email/Password**
3. Habilite a opção **Email/Password**
4. **NÃO** habilite **Email link (passwordless sign-in)** (opcional)
5. Clique em **Save**

## Testando as Regras

Você pode testar as regras diretamente no Firebase Console:

1. Vá em **Firestore Database** → **Rules**
2. Clique na aba **Rules Playground**
3. Configure cenários de teste com diferentes usuários e operações

## Segurança Adicional

Para maior segurança em produção, considere:

1. **Rate Limiting**: Configurar limites de requisições
2. **Email Verification**: Exigir verificação de email antes de permitir login
3. **reCAPTCHA**: Adicionar proteção contra bots no registro
4. **Logs e Monitoring**: Monitorar atividades suspeitas
5. **Backup**: Configurar backups automáticos do Firestore
