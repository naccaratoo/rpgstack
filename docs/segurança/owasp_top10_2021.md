# OWASP Top 10 - 2021 - Guia de Estudos

## A01:2021 – Broken Access Control (Controle de Acesso Quebrado)
**O que é:** Falhas que permitem que usuários acessem recursos ou funcionalidades além de suas permissões.

**Exemplos:**
- Modificar URL para acessar dados de outros usuários
- Elevar privilégios (usuário comum acessando funções de admin)
- Bypass de autenticação

**Como prevenir:**
- Implementar controle de acesso baseado em servidor
- Aplicar princípio do menor privilégio
- Validar permissões em todas as requisições

---

## A02:2021 – Cryptographic Failures (Falhas Criptográficas)
**O que é:** Dados sensíveis expostos por falhas na criptografia ou ausência dela.

**Exemplos:**
- Transmissão de dados em texto plano
- Uso de algoritmos criptográficos fracos
- Chaves criptográficas mal gerenciadas

**Como prevenir:**
- Criptografar dados sensíveis em trânsito e em repouso
- Usar algoritmos modernos e seguros
- Implementar gerenciamento adequado de chaves

---

## A03:2021 – Injection (Injeção)
**O que é:** Inserção de código malicioso em aplicações através de dados não validados.

**Tipos principais:**
- SQL Injection
- NoSQL Injection
- OS Command Injection
- LDAP Injection

**Como prevenir:**
- Usar consultas parametrizadas/prepared statements
- Validar e sanitizar todas as entradas
- Usar ORMs seguros

---

## A04:2021 – Insecure Design (Design Inseguro)
**O que é:** Falhas de segurança no design e arquitetura da aplicação.

**Exemplos:**
- Ausência de modelagem de ameaças
- Padrões de design inseguros
- Falta de controles de segurança por design

**Como prevenir:**
- Implementar modelagem de ameaças
- Usar padrões de design seguros
- Aplicar princípios de "security by design"

---

## A05:2021 – Security Misconfiguration (Configuração de Segurança Incorreta)
**O que é:** Configurações inadequadas ou padrões inseguros em qualquer parte da stack.

**Exemplos:**
- Contas padrão habilitadas
- Mensagens de erro detalhadas expostas
- Recursos desnecessários habilitados

**Como prevenir:**
- Usar configurações seguras por padrão
- Manter sistemas atualizados
- Revisar regularmente configurações

---

## A06:2021 – Vulnerable and Outdated Components (Componentes Vulneráveis e Desatualizados)
**O que é:** Uso de bibliotecas, frameworks ou módulos com vulnerabilidades conhecidas.

**Exemplos:**
- Bibliotecas JavaScript desatualizadas
- Plugins WordPress vulneráveis
- Dependências com CVEs conhecidos

**Como prevenir:**
- Inventariar e monitorar componentes
- Manter dependências atualizadas
- Usar ferramentas de análise de vulnerabilidades

---

## A07:2021 – Identification and Authentication Failures (Falhas de Identificação e Autenticação)
**O que é:** Falhas nos processos de autenticação e gerenciamento de sessão.

**Exemplos:**
- Senhas fracas permitidas
- Ataques de força bruta não mitigados
- Gerenciamento inadequado de sessões

**Como prevenir:**
- Implementar autenticação multifator
- Usar políticas de senha robustas
- Proteger contra ataques automatizados

---

## A08:2021 – Software and Data Integrity Failures (Falhas de Integridade de Software e Dados)
**O que é:** Falhas relacionadas à integridade de código e dados.

**Exemplos:**
- Downloads de atualizações sem verificação
- Pipelines CI/CD inseguros
- Plugins de fontes não confiáveis

**Como prevenir:**
- Usar assinaturas digitais
- Implementar verificação de integridade
- Usar repositórios confiáveis

---

## A09:2021 – Security Logging and Monitoring Failures (Falhas de Log e Monitoramento de Segurança)
**O que é:** Ausência ou inadequação de logs e monitoramento de segurança.

**Exemplos:**
- Eventos de segurança não registrados
- Logs inadequados ou não monitorados
- Alertas ineficientes

**Como prevenir:**
- Implementar logging abrangente
- Monitorar eventos suspeitos
- Estabelecer resposta a incidentes

---

## A10:2021 – Server-Side Request Forgery (SSRF) (Falsificação de Solicitação do Lado do Servidor)
**O que é:** Falhas que permitem que atacantes façam requisições a partir do servidor.

**Exemplos:**
- Acesso a serviços internos via aplicação web
- Varredura de portas internas
- Bypass de firewalls

**Como prevenir:**
- Validar e sanitizar URLs fornecidas pelo usuário
- Implementar listas de permissão para destinos
- Usar firewalls de aplicação

---

## 🎯 Dicas de Estudo

### Ordem de Prioridade Sugerida:
1. **A01 (Broken Access Control)** - Mais comum
2. **A03 (Injection)** - Clássica e fundamental
3. **A07 (Auth Failures)** - Base de segurança
4. **A02 (Crypto Failures)** - Proteção de dados
5. **A05 (Misconfig)** - Muito comum
6. **Demais vulnerabilidades**

### Recursos de Estudo:
- **OWASP WebGoat** - Ambiente prático
- **Damn Vulnerable Web App (DVWA)** - Labs práticos
- **PortSwigger Web Security Academy** - Curso gratuito
- **OWASP Cheat Sheets** - Referências rápidas

### Laboratórios Práticos:
- HackTheBox
- TryHackMe
- VulnHub
- PentesterLab