# Registro de Desenvolvimento – Frontend

Linha do tempo resumida com os principais marcos do app Expo.

1. **Bootstrap**
   - Criei o projeto Expo com TypeScript disabled (JS puro) e configurei ESLint/Prettier.
   - Montei a estrutura base (`src/api`, `src/context`, `src/screens`, `src/components`).

2. **Fluxo de autenticação inicial**
   - Implementei AuthContext, telas de login/cadastro/verificação/reset e conectei ao backend.


3. **Task board e UI**
   - Desenvolvi os componentes de lista, filtros, cards e ícones customizados.
   - Ajustei o tema (claro/escuro), animações suaves e feedback visual para operações (loading, success, error).

4. **Integração com dispositivos**
   - Resolvi o polyfill de `crypto.getRandomValues` usando `expo-random`.
   - Melhorei a detecção automática da base URL usando `expo-constants` + `SourceCode.scriptURL`.


