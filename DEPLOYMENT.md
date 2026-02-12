# Guia de Deploy no Render

Siga estes passos para colocar sua aplicação online usando o **Render Blueprint**.

## 1. Prepare o Código
Certifique-se de que todo o seu código está em um repositório no **GitHub** ou **GitLab**.

## 2. No Painel do Render
1. Acesse [dashboard.render.com](https://dashboard.render.com).
2. Clique no botão azul **"New +"** no canto superior direito.
3. Escolha a opção **"Blueprint"**.

## 3. Conecte seu Repositório
1. Selecione o repositório da sua aplicação que você subiu no Passo 1.
2. O Render irá ler automaticamente o arquivo `render.yaml` que eu criei para você.

## 4. Configuração Automática
O Render irá detectar os seguintes itens definidos no arquivo:
- **Web Service**: Node.js rodando `server.js`.
- **Disco Persistente**: Um disco de 1GB chamado `sqlite-data` montado em `/data`. Isso garante que sua agenda não seja apagada ao reiniciar!

## 5. Finalize o Deploy
1. Clique em **"Apply"** na parte inferior da página.
2. Aguarde alguns minutos enquanto o Render faz a instalação (`npm install`) e gera o site (`npm run build`).
3. Uma URL (ex: `https://vm-scheduling-app.onrender.com`) será gerada no topo do painel.

---

### Notas Importantes
> [!NOTE]
> Como estamos usando o **Plano Grátis**, a primeira vez que você abrir o site após um tempo de inatividade, ele pode demorar de 30 a 50 segundos para "acordar". Isso é normal no Render.

> [!TIP]
> Graças ao **Persistent Disk** que configuramos, o banco de dados `database.sqlite` estará seguro na pasta `/data`, mesmo durante atualizações do site.
