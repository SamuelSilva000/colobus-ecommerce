require('dotenv').config();
const db = require('../config/database');

const calcados = [
  { nome: 'Tenis Nike Air Max 90', marca: 'Nike', descricao: 'Tenis esportivo classico com amortecimento Air.', numeracao: '38-44', cor: 'Branco', precoEmCentavos: 89990, unidadesEmEstoque: 25, imagemPrincipalId: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
  { nome: 'Tenis Adidas Ultraboost 22', marca: 'Adidas', descricao: 'Tenis de corrida com retorno de energia Boost.', numeracao: '39-43', cor: 'Preto', precoEmCentavos: 119990, unidadesEmEstoque: 18, imagemPrincipalId: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600' },
  { nome: 'Tenis Puma RS-X', marca: 'Puma', descricao: 'Tenis chunky com design retrô futurista.', numeracao: '38-42', cor: 'Cinza', precoEmCentavos: 59990, unidadesEmEstoque: 30, imagemPrincipalId: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600' },
  { nome: 'Tenis Vans Old Skool', marca: 'Vans', descricao: 'Tenis skate clássico com listra lateral.', numeracao: '36-44', cor: 'Preto/Branco', precoEmCentavos: 39990, unidadesEmEstoque: 45, imagemPrincipalId: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600' },
  { nome: 'Tenis Converse Chuck Taylor', marca: 'Converse', descricao: 'Tenis de lona icônico e atemporal.', numeracao: '35-43', cor: 'Preto', precoEmCentavos: 29990, unidadesEmEstoque: 50, imagemPrincipalId: 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=600' },
  { nome: 'Sapato Social Masculino Couro', marca: 'Democrata', descricao: 'Sapato social em couro legítimo, ideal para trabalho.', numeracao: '38-44', cor: 'Marrom', precoEmCentavos: 44990, unidadesEmEstoque: 20, imagemPrincipalId: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600' },
  { nome: 'Sandalia Feminina Salto Alto', marca: 'Arezzo', descricao: 'Sandália elegante com salto fino revestido.', numeracao: '34-39', cor: 'Vermelho', precoEmCentavos: 39990, unidadesEmEstoque: 15, imagemPrincipalId: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600' },
  { nome: 'Bota Feminina Coturno', marca: 'Santa Lolla', descricao: 'Coturno em couro com cadarço e zíper lateral.', numeracao: '35-40', cor: 'Preto', precoEmCentavos: 54990, unidadesEmEstoque: 22, imagemPrincipalId: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600' },
  { nome: 'Tenis Infantil LED', marca: 'Molekinha', descricao: 'Tenis infantil com solado de LED colorido.', numeracao: '26-33', cor: 'Azul', precoEmCentavos: 19990, unidadesEmEstoque: 40, imagemPrincipalId: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600' },
  { nome: 'Chinelo Havaianas Top', marca: 'Havaianas', descricao: 'Chinelo tradicional brasileiro, confortável e durável.', numeracao: '33-45', cor: 'Verde', precoEmCentavos: 3990, unidadesEmEstoque: 100, imagemPrincipalId: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600' },
  { nome: 'Tenis Mizuno Wave Prophecy', marca: 'Mizuno', descricao: 'Tenis de alta performance para corrida de longa distância.', numeracao: '39-44', cor: 'Azul', precoEmCentavos: 99990, unidadesEmEstoque: 12, imagemPrincipalId: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600' },
  { nome: 'Tenis New Balance 574', marca: 'New Balance', descricao: 'Tenis casual com design retrô e conforto premium.', numeracao: '38-45', cor: 'Cinza', precoEmCentavos: 49990, unidadesEmEstoque: 28, imagemPrincipalId: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600' },
];

const existentes = db.prepare('SELECT COUNT(*) as total FROM produtos').get().total;

if (existentes > 0) {
  console.log(`Ja existem ${existentes} produtos cadastrados. Pulando seed.`);
  process.exit(0);
}

const stmt = db.prepare(`
  INSERT INTO produtos (nome, marca, descricao, numeracao, cor, preco_em_centavos, unidades_em_estoque, imagem_principal_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const inserirMuitos = db.transaction((itens) => {
  for (const p of itens) {
    stmt.run(p.nome, p.marca, p.descricao, p.numeracao, p.cor, p.precoEmCentavos, p.unidadesEmEstoque, p.imagemPrincipalId);
  }
});

inserirMuitos(calcados);

console.log(`Seed concluido: ${calcados.length} calcados inseridos.`);
process.exit(0);
