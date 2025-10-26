# Frontend – To Do List (Expo / React Native / Web)

App móvel/Web construído em Expo que consome o backend Django. Possui telas para cadastro, verificação, login, recuperação de senha e gerenciamento completo das tarefas.

## Pré‑requisitos

| Dependência | Versão recomendada | Observações |
| ----------- | ------------------ | ----------- |
| Node.js | 18.x | Uso `nvm use 18` em desenvolvimento |
| npm | 9+ | Já acompanha o Node 18 |
| Expo CLI | 6+ | Instalado via `npm install -g expo-cli` (opcional) |
| Expo Go | App no dispositivo físico | Necessário para testar em mobile real ou Android Studio |

## Setup rápido

1. Instale dependências
   ```bash
   cd frontend
   npm install
   ```


2. Start do Metro/Expo
   ```bash
   npx expo start --clear  
   ```
   Use as teclas: `w` (web), `a` (Android emulador), `r` (reload) e `Shift+r` (clear metro cache).

## Execução no dispositivo

1. Conecte PC e celular na mesma rede Wi‑Fi.
2. Abra o app **Expo Go** e escaneie o QR code mostrado no terminal/Metro UI.
3. Se precisar de túnel, rode `npx expo start --tunnel` e exponha o backend (ngrok ou outro). Ajuste `EXPO_PUBLIC_API_URL` para a URL pública.

## API Client (tokens no storage)

- `src/api/client.js` usa `axios` com `withCredentials`.
- O fluxo de autenticação foi atualizado para guardar o `access_token` em memória e sincronizar `refresh_token` no `localStorage` quando o app roda no navegador. No mobile, caímos para Async Storage (via polyfill) para garantir persistência mesmo quando os cookies não estão disponíveis.
- O interceptor renova o token automaticamente e chama listeners de logout quando o refresh falha.



## Estrutura principal

- `src/api/` – cliente HTTP e utilitários.
- `src/context/` – Auth, Theme, Notifications e Query.
- `src/screens/` – telas (login, register, verify, forgot/reset, task list).
- `src/components/` – UI compartilhada (cards, modals, inputs).
- `src/lib/queryClient` – configuração do React Query.

## Comentários

- Durante o desenvolvimento deste projeto, todo o processo foi realizado de forma local, sem integração direta e contínua com o GitHub.
Isso ocorreu devido à falta de experiência prévia com o uso de versionamento de código, sendo necessário aprender e compreender o funcionamento do Git e GitHub do zero ao longo da execução do trabalho.

   Com o objetivo de atender aos critérios de commits separados e organizados, realizei uma simulação de histórico de commits. Para isso, efetuei pequenas alterações em trechos do código, como adição ou remoção de comentários e ajustes pontuais em linhas específicas, associando cada commit a um título que representasse o arquivo ou etapa do desenvolvimento envolvida.

   Embora o controle de versão não tenha acompanhado o progresso em tempo real, o esforço foi direcionado para representar de forma aproximada a sequência lógica do desenvolvimento e demonstrar o aprendizado adquirido no uso do Git e GitHub.