# 🏢 ARCADECORE v3 - PARTE 11: OPERACIONES Y NEGOCIO

> **Guía para operar máquinas ArcadeCore en producción: precios, mantenimiento, seguridad, legales.**

---

## 📊 MODELO DE NEGOCIO

### Por monedas (Traditional Arcade)

```
Mecánica:
├─ Jugador inserta $0.25
├─ Obtiene 1 crédito
├─ Juega durante tiempo de crédito
├─ Vuelve a insertar para continuar

Ingresos:
├─ $0.25 por juego = $2.40 por 10 juegos/hora
├─ 8 horas × 10 juegos × $0.25 = $20/día
├─ $20 × 30 días = $600/mes por máquina
├─ Menos gastos (eléctrica, mantenimiento) = $400/mes neto

ROI: $500 máquina ÷ $400/mes = ~1.25 meses payback
```

### Por suscripción (Modern model)

```
Mecánica:
├─ Cliente paga $X/mes
├─ Acceso ilimitado a todos juegos
├─ Progreso guardado en nube
├─ Competencia global scores

Precios:
├─ $5/mes (casual)
├─ $10/mes (gamer)
├─ $20/mes (VIP + extras)

Proyección:
├─ 100 usuarios × $10 = $1,000/mes
├─ Menos costos = $700/mes neto
```

### Híbrido (Monedas + suscripción)

```
Mecánica:
├─ Sin suscripción: Monedas normales
├─ Con suscripción: Juego ilimitado

Ingresos:
├─ 70% usuarios paguen $0.25/juego
├─ 30% usuarios suscritos $10/mes
└─ Ingresos mixtos = mejor

Mejor para:
├─ Arcade comercial
├─ Maximizar ingresos
```

---

## 💰 PRICING POR REGIÓN

### USA

```
Arcade: $0.50 por juego
├─ MAME: $0.25
├─ Consolas: $0.50
├─ Modernos: $0.75

Suscripción: $15-20/mes

Ubicaciones típicas:
├─ Bar: Mejor ubicación, dividir ingresos 30-50%
├─ Arcade dedicada: Tú retienes 100%
├─ Restaurante: Dividir 20-30%
├─ Biblioteca pública: Gratis para comunidad
```

### México / Latinoamérica

```
Arcade: $0.10-0.20 por juego
├─ MAME: $0.10
├─ Consolas: $0.15
├─ Premium: $0.25

Suscripción: $3-5 USD (~$50-80 MXN/mes)

Ubicaciones:
├─ Centro comercial
├─ Parque
├─ Cantina / Bar
├─ Cafetería

Nota: Poder adquisitivo más bajo
      Pero más usuarios para volumen
```

### Europa

```
Arcade: €0.50 por juego
├─ Arcade: €0.50
├─ Consolas: €1.00

Suscripción: €10-15/mes

Regulaciones:
├─ Requiere licencia de gaming
├─ Impuestos sobre juegos de azar
├─ Restricción edad para ciertos juegos

Ubicaciones:
├─ Arcade dedicada
├─ Centro entretenimiento
├─ Museo interactivo
```

---

## 🔐 SEGURIDAD Y OPERADOR PANEL

### PIN de Operador

En ArcadeCore, panel operador requiere PIN:

```
Config en: config/kiosk.yaml

operator_panel:
  enabled: true
  pin: "1234"          ← CAMBIAR!!!
  timeout_seconds: 300  ← Logout tras 5 min
  
  allowed_actions:
    - view_earnings
    - restart_machine
    - update_games
    - change_settings
    - view_logs
    - reboot
```

### Credenciales

```yaml
# config/operator.yaml
operators:
  - name: "Admin"
    pin: "1234"
    role: "admin"
    permissions: ["*"]
    
  - name: "Manager"
    pin: "5678"
    role: "manager"
    permissions: ["view_earnings", "restart"]
    
  - name: "Tech"
    pin: "9999"
    role: "tech"
    permissions: ["update_games", "view_logs"]
```

### Logging de acciones operador

```rust
// src-tauri/src/core/operator_log.rs
#[derive(Debug, Serialize)]
pub struct OperatorAction {
    pub timestamp: DateTime<Utc>,
    pub operator_pin: String,
    pub action: String,
    pub details: serde_json::Value,
}

impl OperatorLog {
    pub async fn log_action(
        &self,
        operator: &str,
        action: &str,
        details: serde_json::json!,
    ) -> Result<()> {
        let entry = OperatorAction {
            timestamp: Utc::now(),
            operator_pin: hash(operator),  ← NUNCA guardar PIN en texto
            action: action.to_string(),
            details,
        };
        
        // Guardar en BD con encriptación
        self.db.insert_log(&entry).await?;
        Ok(())
    }
}
```

### Panel operador UI

```tsx
// src/pages/OperatorPanel.tsx
export function OperatorPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  
  return (
    <div className="operator-panel">
      {!authenticated ? (
        <OperatorLogin onLogin={handleLogin} />
      ) : (
        <OperatorDashboard
          onLogout={() => {
            setAuthenticated(false);
            setPin("");
          }}
        />
      )}
    </div>
  );
}
```

---

## 📈 ESTADÍSTICAS Y REPORTES

### Dashboard operador

```
┌─────────────────────────────────────┐
│        ARCADECORE OPERATOR           │
├─────────────────────────────────────┤
│                                     │
│ TODAY EARNINGS:        $45.25       │
│ THIS MONTH:           $1,235.60     │
│ TOTAL UPTIME:         23h 45m       │
│ PLAYERS TODAY:            247       │
│                                     │
│ TOP 5 GAMES:                        │
│  1. Pac-Man       $156.25 (89 plays)│
│  2. Street Ftr    $120.00 (48 plays)│
│  3. Galaga        $98.75 (79 plays) │
│  4. Donkey Kong   $87.50 (70 plays) │
│  5. Centipede     $67.50 (54 plays) │
│                                     │
│ BUTTON WEAR (Next service):         │
│  ████████░░ Button P1-1 (85%)       │
│  ██████░░░░ Joy P1 (65%)            │
│                                     │
└─────────────────────────────────────┘
```

### Reportes exportables

```rust
pub async fn generate_report(
    from: DateTime<Utc>,
    to: DateTime<Utc>,
    format: ReportFormat, // PDF, CSV, JSON
) -> Result<Vec<u8>> {
    // Query earnings, plays, top games
    let data = db.get_earnings_range(from, to).await?;
    
    match format {
        ReportFormat::PDF => generate_pdf(&data),
        ReportFormat::CSV => generate_csv(&data),
        ReportFormat::JSON => Ok(serde_json::to_vec(&data)?),
    }
}
```

---

## 🛠️ MANTENIMIENTO PREVENTIVO

### Checklist diario (5 min)

```
□ Revisar panel físico limpio
□ Probar botones (ninguno pegajoso)
□ Probar joystick (responde en 4 direcciones)
□ Revisar conectores no sueltos
□ Pantalla sin manchas
□ Sonido audible
□ Máquina sin ruidos extraños
□ App respondiendo (no freezes)
```

### Checklist semanal (30 min)

```
□ Limpiar pantalla a fondo (alcohol + papel suave)
□ Limpiar botones con trapo húmedo
□ Revisar joystick sin polvo
□ Revisar cables HDMI/USB conexión
□ Revisar ventiladores funcionando
□ Reiniciar máquina (poder ciclo)
□ Verificar log de errores (si hay)
□ Backup BD (si es online)
```

### Checklist mensual (1-2 horas)

```
□ Abrir gabinete
□ Limpiar filtros aire
□ Revisar capacitores (si CRT): ¿bulging?
□ Revisar todas soldaduras cableado
□ Revisar desgaste botones (cambiar si <50% vida)
□ Revistar lubrificante joystick (agregar si seco)
□ Revisar conexiones poder (sin quemaduras)
□ Revisar temperatura circuito (con termómetro)
□ Revisar logs app completamente
□ Hacer full backup datos
□ Actualizar software ArcadeCore si disponible
```

### Checklist anual (4-8 horas)

```
□ Service profesional si aplicable (para CRT)
□ Cambiar batería CMOS PC (si aplica)
□ Limpiar completamente interior polvo
□ Revisar capacitores electrolíticos (test ESR)
□ Reemplazar joystick (si mucho desgaste)
□ Reemplazar botones todos (wear uniforme)
□ Test de stress (24h funcionamiento continuo)
□ Calibración pantalla (si CRT)
□ Auditoría seguridad (PIN, permisos)
□ Limpieza profunda gabinete (pintura)
```

---

## 🚨 TROUBLESHOOTING OPERADOR

### Problema: Máquina no inicia

```
1. Revisar poder conectado ✓
2. Revisar PC encendida
3. Revisar monitor encendido
4. Esperar boot (1-2 min para Linux/Windows)
5. Si no carga:
   - Revisar HDMI conectado
   - Reiniciar PC (botón físico)
   - Si sigue: Llamar técnico
```

### Problema: Botones no responden

```
1. Revisar físicamente botón no está pegado
2. Revisar cable USB conectado a encoder
3. Cambiar USB puerto (si otra máquina, funciona)
4. En ArcadeCore, ir a Operator Panel:
   → Input Test
   → Presionar botón → ¿Responde?
5. Si no responde en test:
   - Revisar pin soldered en encoder
   - Revisar cable botón conectado
   - Reemplazar encoder
```

### Problema: Juego se congela

```
1. Esperar 10 segundos (carga)
2. Si sigue:
   - Presionar ESC para volver a menú
   - En Operator Panel, restart ArcadeCore
3. Si freezea repetidamente:
   - ROM corrupta (reescanning library)
   - Emulador bug (probar juego diferente)
   - Problema hardware (temp, RAM)
   - Revisar logs en Operator Panel
```

### Problema: No hay sonido

```
1. Revisar volumen PC no está en mute
2. Revisar cable audio conectado
3. Revisar speakers encendidos
4. Revisar en ArcadeCore settings:
   → Audio device seleccionado
   → Volumen no en mute
5. Reboot audio driver (Windows)
6. Si sigue: Reemplazar cable/speaker
```

---

## 📋 TEMPLATE: CONTRATO UBICACIÓN

Para si alquilas máquina a un negocio:

```
ARCADECORE MACHINE RENTAL AGREEMENT

1. EQUIPO
   Machine: ArcadeCore [Modelo]
   Serial: [####]
   Ubicación: [Dirección]

2. RENTAL TERMS
   Período: 12 meses
   Rent: $[XXX]/mes
   Depósito: $[XXX] (reembolsable)
   Pagos: Día 1 de mes

3. RESPONSABILIDADES INQUILINO
   - Vigilar máquina durante horas de operación
   - Mantener limpia
   - Reportar daño inmediatamente
   - No permitir menores de edad (si aplica)
   - No agregar juegos no autorizados
   - Permitir inspecciones mensuales

4. RESPONSABILIDADES PROPIETARIO
   - Mantenimiento técnico
   - Software actualizaciones
   - Reparaciones mayor daño
   - Colección monedas si manualmente

5. DAÑO
   Daño accidental: Propietario cubre
   Daño intencional: Inquilino cubre
   Rotura botones por uso: Inquilino (deducible $50)
   Rotura joystick: Inquilino (deducible $100)

6. TERMINACIÓN
   30 días noticia
   Equipo regresa en condición original (wear normal OK)
   Depósito reembolsado menos daño

Firmado: _______________  Fecha: _______
```

---

## 🌍 REGULACIONES POR PAÍS

### USA

```
Requerimientos:
□ Licencia de negocio local
□ Licencia arcade (algunos estados)
□ Impuestos sobre juegos
□ No permitir menores en ciertos juegos (ESRB)

Restricciones:
- Algunos juegos clasificados M (17+)
- Límites horas para menores

Impuestos:
- Federal: 15-35% impuesto ingresos brutos
- Estado: Varía (0-10%)
- Local: Varía
```

### México

```
Requerimientos:
□ RFC (Registro Federal de Contribuyentes)
□ Licencia municipal
□ Registro SAT
□ IEPS en caso de aplicar

Regulaciones:
- Máquinas no pueden tener apuestas (prohibido)
- Inspecciones municipales regularmente
- Restricción de horarios (ej: no después 22:00)

Impuestos:
- IVA: 16%
- ISR: 20-35%
- IEPS: Depende estado
```

### España / Europa

```
Requerimientos:
□ Licencia juegos azar (si monedas)
□ Licencia entretenimiento
□ GDPR compliance (datos jugadores)
□ PSD2 si aceptas pagos

Regulaciones:
- Juegos deben estar en lista autorizada
- Máximo payout regulado
- Menores no permitidos ciertos juegos

Taxes:
- IVA: 21%
- Impuesto especial juegos
- Local taxes
```

---

## 💻 SETUP PARA MÚLTIPLES MÁQUINAS

Si tienes 3+ máquinas:

### Servidor central

```
Hardware:
├─ PC servidor Linux pequeño ($200-300)
├─ 16GB RAM
├─ 1TB SSD
└─ Conexión internet estable

Software:
├─ PostgreSQL (BD central)
├─ ArcadeCore API server
├─ Admin dashboard web
└─ Analytics

Config:
├─ Cada máquina conecta a servidor
├─ Sincroniza earnings automático
├─ Reportes consolidados
├─ Updates distribuidos
```

### Replicación de datos

```rust
// Cada máquina envía datos al servidor central
pub async fn sync_to_server() -> Result<()> {
    let earnings = db.get_unsync_earnings().await?;
    let plays = db.get_unsync_plays().await?;
    let top_scores = db.get_unsync_scores().await?;
    
    let client = reqwest::Client::new();
    client
        .post("https://arcadecore-server/api/sync")
        .json(&SyncPayload { earnings, plays, top_scores })
        .send()
        .await?;
    
    db.mark_synced().await?;
    Ok(())
}
```

### Dashboard central web

```typescript
// Admin ve todas máquinas
const machinesData = await fetch('/api/machines')
  .then(r => r.json());

// Total earnings
const totalEarnings = machinesData
  .reduce((sum, m) => sum + m.earnings, 0);

// Top games across all machines
const topGames = machinesData
  .flatMap(m => m.games)
  .sort((a, b) => b.plays - a.plays)
  .slice(0, 10);
```

---

## 🎓 CAPACITACIÓN OPERADOR

### Si empleas operador

Entrenar en:

```
1. Panel de Control (1 hora)
   - Cómo ver earnings
   - Cómo reiniciar
   - Cómo recolectar monedas
   - Cómo reportar problemas

2. Mantenimiento básico (1 hora)
   - Limpiar botones
   - Limpiar pantalla
   - Revisar cables
   - Checklist diario

3. Troubleshooting (1 hora)
   - Problema común 1: Solución
   - Problema común 2: Solución
   - Cuándo llamar técnico

4. Seguridad (30 min)
   - PIN confidencial
   - No compartir con clientes
   - Reportar acceso no autorizado
   - Backup de datos

5. Procedimientos legal (30 min)
   - Cómo reportar ingresos
   - Impuestos
   - Documentación
   - Cumplimiento regulatorio
```

---

## 📞 SOPORTE TÉCNICO

### Niveles de soporte

```
Nivel 1: Operador (Tú o empleado)
├─ Checklist diario
├─ Reboot básico
├─ Reporta problemas

Nivel 2: Francisco (Desarrollador)
├─ Acceso remoto SSH
├─ Actualizaciones software
├─ Debugging app
├─ Soporte por email/Discord

Nivel 3: Técnico especialista (Externo)
├─ Reparación hardware
├─ Soldering/electrónica
├─ Reemplazo componentes
└─ Presupuesto adicional
```

### Contacting support

```
EMERGENCIA (máquina inactiva):
└─ Discord DM o teléfono (ASAP)

NORMAL (funciona pero bug):
└─ Email con descripción + logs

FEATURE REQUEST:
└─ GitHub issue o forum

Para acceso remoto:
└─ SSH:  ssh usuario@[IP_máquina]
└─ Credential: Te doy por securely
└─ Instala: `curl https://[support] | bash`
```

---

## ✅ CHECKLIST: MÁQUINA LISTA PARA OPERACIÓN

Antes de poner máquina en público:

- [ ] Software ArcadeCore v1.0+ instalado
- [ ] 100+ juegos funcionan
- [ ] Todos controles testados
- [ ] Moneda funciona (si tiene)
- [ ] Sonido audible
- [ ] Pantalla sin defectos visuales
- [ ] Panel operador funcionando
- [ ] PIN operador configurado
- [ ] Máquina passou 24h stress test sin error
- [ ] Logs limpio (sin warnings frecuentes)
- [ ] BD backup configurado
- [ ] Documentación impresa cerca máquina
- [ ] Número técnico visibles para operador
- [ ] Licencias/permisos locales OK
- [ ] Seguro máquina (si aplicable)
- [ ] Contrato firmado (si alquila)

**Si TODO ✅:** ¡Máquina lista para dinero! 🎉

---

## 🎉 CONCLUSIÓN

Con ArcadeCore tienes:

```
✅ Software profesional
✅ Panel operador seguro
✅ Analytics completos
✅ Mantenimiento estructurado
✅ Escalable a múltiples máquinas
✅ Soporte técnico

Potencial de ingresos:
└─ $400-800/mes por máquina
└─ Payback en 1-2 meses
└─ Escalable (10 máquinas = $8,000/mes)
```

**¡Bienvenido al negocio arcade moderno!** 🏆

---

*Fin de documentos principales. Próximo: Templates de prompts para IA*
