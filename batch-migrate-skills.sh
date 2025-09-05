#!/bin/bash

# Batch Skills Migration Script

echo "🎯 Starting batch skills migration..."

API_URL="http://localhost:3002/api/skills"

# Function to create skill
create_skill() {
    local name="$1"
    local description="$2" 
    local type="$3"
    local classe="$4"
    local characterId="$5"
    local characterName="$6"
    local damage="$7"
    local anima_cost="$8"
    local cooldown="$9"
    
    echo "🔮 Migrating: $name"
    
    curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"description\": \"$description\",
            \"type\": \"$type\",
            \"classe\": \"$classe\",
            \"characterId\": \"$characterId\", 
            \"characterName\": \"$characterName\",
            \"damage\": $damage,
            \"anima_cost\": $anima_cost,
            \"cooldown\": $cooldown
        }" -s > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
    fi
    
    sleep 0.5
}

# Aurelius Ignisvox - Roman Commander (remaining skills)
create_skill "🛡️ Formação Testudo Flamejante" "Adota formação defensiva romana com escudos em chamas" "buff" "Armamentista" "A9C4N0001E" "Aurelius Ignisvox" 0 40 2

create_skill "⚔️ Gladius Incendium" "Ataque preciso com gladius envolvido em chamas sagradas" "combat" "Armamentista" "A9C4N0001E" "Aurelius Ignisvox" 90 30 1

# Shi Wuxing - Chinese Master
create_skill "🌊 Ciclo dos Cinco Elementos" "Rotaciona através dos elementos Wu Xing com efeitos únicos" "magic" "Arcano" "EA32D10F2D" "Shi Wuxing" 75 35 0

create_skill "☯️ Harmonia do Yin Yang" "Equilibra energia vital entre Shi e o alvo" "utility" "Arcano" "EA32D10F2D" "Shi Wuxing" 0 25 1

create_skill "🐉 Invocação do Dragão Imperial" "Canaliza o poder do dragão chinês para ataque devastador" "combat" "Arcano" "EA32D10F2D" "Shi Wuxing" 110 60 3

# Miloš Železnikov - Slavic Warrior
create_skill "🔨 Forja do Dragão Eslavo" "Invoca técnicas ancestrais para forjar arma de escamas de dragão" "combat" "Lutador" "045CCF3515" "Miloš Železnikov" 95 0 0

create_skill "⚒️ Martelo dos Ancestrais" "Invoca espíritos de ferreiros eslavos para guiar o ataque" "combat" "Lutador" "045CCF3515" "Miloš Železnikov" 70 30 1

create_skill "🛡️ Koljčuga Drakonova" "Forja armadura temporária de escamas de dragão" "buff" "Lutador" "045CCF3515" "Miloš Železnikov" 0 45 2

# Pythia Kassandra - Greek Oracle  
create_skill "🔮 Visão Oracular dos Três Destinos" "Vislumbra futuros possíveis para alterar o combate" "magic" "Arcano" "7A8B9C0D1E" "Pythia Kassandra" 70 35 0

create_skill "🌪️ Tempestade Profética de Delfos" "Invoca os ventos sagrados carregados com fragmentos de profecias" "magic" "Arcano" "7A8B9C0D1E" "Pythia Kassandra" 95 50 2

create_skill "👁️ Olho de Apolo" "Canaliza a visão do deus para revelar e explorar todas as fraquezas" "utility" "Arcano" "7A8B9C0D1E" "Pythia Kassandra" 0 25 3

# Itzel Nahualli - Aztec Shaman
create_skill "🐆 Metamorfose do Ocelotl" "Transforma-se na forma sagrada do jaguar das sombras" "buff" "Arcano" "2F3E4D5C6B" "Itzel Nahualli" 80 35 1

create_skill "🦅 Voo da Águia Dourada" "Transforma-se em águia e ataca do céu com precisão divina" "combat" "Arcano" "2F3E4D5C6B" "Itzel Nahualli" 75 40 2

create_skill "🐍 Serpente Emplumada" "Canaliza o poder de Quetzalcoatl através de transformação serpentina" "magic" "Arcano" "2F3E4D5C6B" "Itzel Nahualli" 60 45 2

# Giovanni da Ferrara - Italian Artisan
create_skill "⚙️ Balista da Precisão Florentina" "Dispara projétil de precisão usando engenharia avançada" "combat" "Armamentista" "9A8B7C6D5E" "Giovanni da Ferrara" 100 25 1

create_skill "🛠️ Oficina Portátil Renascentista" "Monta uma oficina temporária para criar dispositivos em batalha" "utility" "Armamentista" "9A8B7C6D5E" "Giovanni da Ferrara" 0 50 3

create_skill "🎨 Máquina Voadora de Leonardo" "Voa temporariamente usando protótipo baseado nos estudos de da Vinci" "combat" "Armamentista" "9A8B7C6D5E" "Giovanni da Ferrara" 90 60 2

# Yamazaki Karakuri - Japanese Engineer
create_skill "⚙️ Invocação do Karakuri Kyūdō" "Constrói e ativa autômato arqueiro de precisão extrema" "combat" "Armamentista" "4F3E2D1C0B" "Yamazaki Karakuri" 85 40 2

create_skill "🍵 Ritual do Karakuri Chadō" "Ativa autômato servo do chá que cura e harmoniza o grupo" "healing" "Armamentista" "4F3E2D1C0B" "Yamazaki Karakuri" 0 35 2

create_skill "🛡️ Defesa do Karakuri Bushi" "Ativa autômato guerreiro para proteção e contra-ataques" "buff" "Armamentista" "4F3E2D1C0B" "Yamazaki Karakuri" 70 50 3

echo ""
echo "📋 Migration completed! Testing verification..."

# Test API endpoints
echo "🔍 Testing GET /api/skills..."
curl -s "$API_URL" | head -c 100
echo "..."

echo ""
echo "🎉 Batch migration completed! Check skills database for results."