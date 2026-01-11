/**
 * Icon Usage Examples
 * 
 * Practical examples of how to use Merlin icons in questions
 */

import React from 'react';
import {
  ExpressTunnelIcon,
  ElectricIcon,
  GasFlameIcon,
  PumpIcon,
  BlowerIcon,
  SolarPanelIcon,
  EVChargerIcon,
  VacuumIcon,
  MerlinAvatarIcon
} from './MerlinIcons';

// ============================================================================
// EXAMPLE 1: Button Group with Icons
// ============================================================================
export function FacilityTypeQuestion() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button className="p-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 transition-all">
        <div className="mb-3">
          <ExpressTunnelIcon className="w-8 h-8 text-purple-400" />
        </div>
        <div className="font-semibold text-white mb-1">Express Tunnel</div>
        <div className="text-sm text-slate-400">High-speed conveyor</div>
      </button>

      <button className="p-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 transition-all">
        <div className="mb-3">
          <ElectricIcon className="w-8 h-8 text-purple-400" />
        </div>
        <div className="font-semibold text-white mb-1">Electric Heater</div>
        <div className="text-sm text-slate-400">50-150 kW demand</div>
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Icon in Input Label
// ============================================================================
export function LabelWithIcon() {
  return (
    <label className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/50">
      <SolarPanelIcon className="w-6 h-6 text-purple-400" />
      <div className="flex-1">
        <div className="font-semibold text-white">Solar Panel Area</div>
        <div className="text-sm text-slate-400">Available roof space for panels</div>
      </div>
    </label>
  );
}

// ============================================================================
// EXAMPLE 3: Icon in Card Header
// ============================================================================
export function CardWithIcon() {
  return (
    <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg bg-purple-500/10">
          <EVChargerIcon className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            EV Charging Station
          </h3>
          <p className="text-slate-400 text-sm">
            Level 2 charging, 7-19 kW per port
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Icon in List Item
// ============================================================================
export function IconList() {
  const items = [
    { icon: PumpIcon, label: 'High-Pressure Pumps', value: '3 units' },
    { icon: BlowerIcon, label: 'Dryer Blowers', value: '10 units' },
    { icon: VacuumIcon, label: 'Vacuum Stations', value: '8 stalls' }
  ];

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
          <item.icon className="w-5 h-5 text-purple-400" />
          <span className="flex-1 text-white">{item.label}</span>
          <span className="text-slate-400 text-sm">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Animated Icon Button
// ============================================================================
export function AnimatedIconButton() {
  return (
    <button className="group relative p-4 rounded-xl bg-purple-600 hover:bg-purple-500 transition-all hover:scale-105">
      <BlowerIcon className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-500" />
      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
        3
      </span>
    </button>
  );
}

// ============================================================================
// EXAMPLE 6: Icon with Badge
// ============================================================================
export function IconWithBadge() {
  return (
    <div className="relative inline-block">
      <div className="p-4 rounded-xl bg-slate-800">
        <GasFlameIcon className="w-8 h-8 text-orange-400" />
      </div>
      <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-green-500 rounded-full text-white text-xs font-semibold">
        Available
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Icon Grid Selector
// ============================================================================
export function IconGridSelector() {
  const options = [
    { id: 'pump', Icon: PumpIcon, label: 'Pumps' },
    { id: 'blower', Icon: BlowerIcon, label: 'Blowers' },
    { id: 'vacuum', Icon: VacuumIcon, label: 'Vacuum' },
    { id: 'solar', Icon: SolarPanelIcon, label: 'Solar' }
  ];
  const [selected, setSelected] = React.useState<string[]>([]);

  return (
    <div className="grid grid-cols-4 gap-3">
      {options.map(({ id, Icon, label }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => {
              setSelected(prev =>
                prev.includes(id)
                  ? prev.filter(x => x !== id)
                  : [...prev, id]
              );
            }}
            className={`
              p-4 rounded-xl text-center transition-all
              ${isSelected
                ? 'bg-purple-600 scale-105'
                : 'bg-slate-800 hover:bg-slate-700'
              }
            `}
          >
            <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
            <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
              {label}
            </div>
            {isSelected && (
              <div className="w-4 h-4 bg-white rounded-full mt-2 mx-auto" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Icon in Notification
// ============================================================================
export function IconNotification() {
  return (
    <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <MerlinAvatarIcon className="w-8 h-8 text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-purple-200 mb-1">
            Merlin's Tip
          </div>
          <div className="text-sm text-purple-300">
            High-pressure pumps typically account for 20-30% of total energy consumption in car washes.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Icon Progress Steps
// ============================================================================
export function IconProgressSteps() {
  const steps = [
    { icon: ExpressTunnelIcon, label: 'Facility', complete: true },
    { icon: ElectricIcon, label: 'Equipment', complete: true },
    { icon: SolarPanelIcon, label: 'Solar', complete: false },
    { icon: EVChargerIcon, label: 'Charging', complete: false }
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-2">
            <div className={`
              p-3 rounded-xl transition-all
              ${step.complete
                ? 'bg-purple-600'
                : 'bg-slate-800 border border-slate-700'
              }
            `}>
              <step.icon className={`w-6 h-6 ${step.complete ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div className={`text-xs font-medium ${step.complete ? 'text-white' : 'text-slate-400'}`}>
              {step.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${step.complete ? 'bg-purple-600' : 'bg-slate-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Icon Tooltip
// ============================================================================
export function IconTooltip() {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <PumpIcon className="w-5 h-5 text-slate-400" />
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl whitespace-nowrap">
          <div className="text-sm text-white font-medium">High-Pressure Pumps</div>
          <div className="text-xs text-slate-400">15-25 HP each</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-8 border-transparent border-t-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DEMO PAGE
// ============================================================================
export function IconUsageDemo() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Merlin Icons Usage Examples
          </h1>
          <p className="text-xl text-slate-400">
            Copy & paste these patterns into your components
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Button Group</h2>
          <FacilityTypeQuestion />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. Label with Icon</h2>
          <LabelWithIcon />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. Card with Icon</h2>
          <CardWithIcon />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. Icon List</h2>
          <IconList />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">5. Animated Button</h2>
          <AnimatedIconButton />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">6. Icon with Badge</h2>
          <IconWithBadge />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">7. Grid Selector</h2>
          <IconGridSelector />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">8. Notification</h2>
          <IconNotification />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">9. Progress Steps</h2>
          <IconProgressSteps />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">10. Tooltip</h2>
          <IconTooltip />
        </section>
      </div>
    </div>
  );
}

export default IconUsageDemo;
