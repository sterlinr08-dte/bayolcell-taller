// MÓDULO 1 (3.4) — Interpretación automática de datos eléctricos / batería.
// Recibe el objeto de batería de ideviceinfo y genera alertas legibles.
(function (g) {
  function num(v) { const n = parseInt(v, 10); return isNaN(n) ? null : n; }

  function evaluarBateria(bat) {
    const alertas = [];
    const voltaje = num(bat.BatteryVoltage);              // mV
    const ciclos = num(bat.CycleCount || bat.BatteryCycleCount);
    const designCap = num(bat.DesignCapacity);
    const nominalCap = num(bat.NominalChargeCapacity);
    let saludPct = null;
    if (designCap && nominalCap) saludPct = Math.round((nominalCap / designCap) * 100);

    if (voltaje !== null) {
      if (voltaje < 3200) alertas.push({ nivel: 'critico', titulo: 'Voltaje muy bajo (' + voltaje + ' mV)',
        causa: 'PMIC no levanta raíl, batería agotada o IC Tigris defectuoso.' });
      else if (voltaje > 4350) alertas.push({ nivel: 'critico', titulo: 'Sobrevoltaje (' + voltaje + ' mV)',
        causa: 'Posible Tristar/Hydra defectuoso — riesgo de sobrecarga.' });
    }
    if (ciclos !== null && saludPct !== null && ciclos > 800 && saludPct < 70) {
      alertas.push({ nivel: 'alerta', titulo: 'Batería degradada (' + ciclos + ' ciclos, ' + saludPct + '% salud)',
        causa: 'Posible expansión — revisar línea SWI y reemplazar batería.' });
    }
    if (String(bat.ExternalConnected) === 'false' && String(bat.IsCharging) === 'false') {
      // informativo, no siempre indica daño
    }
    if (String(bat.ExternalChargeCapable) === 'false') {
      alertas.push({ nivel: 'alerta', titulo: 'No acepta carga externa',
        causa: 'Tristar IC dañado — verificar pines 15-16 con voltímetro.' });
    }

    return { voltaje, ciclos, designCap, nominalCap, saludPct, alertas };
  }

  g.evaluarBateria = evaluarBateria;
})(typeof window !== 'undefined' ? window : global);
