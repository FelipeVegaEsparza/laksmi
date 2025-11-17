import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface BusinessHoursFormProps {
  businessHours?: BusinessHours;
  onChange: (businessHours: BusinessHours) => void;
}

const defaultDaySchedule: DaySchedule = {
  isOpen: true,
  openTime: '09:00',
  closeTime: '20:00',
  lunchStart: '13:00',
  lunchEnd: '14:00'
};

const dayNames = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const BusinessHoursForm: React.FC<BusinessHoursFormProps> = ({ businessHours, onChange }) => {
  const [hours, setHours] = useState<BusinessHours>(
    businessHours || {
      monday: defaultDaySchedule,
      tuesday: defaultDaySchedule,
      wednesday: defaultDaySchedule,
      thursday: defaultDaySchedule,
      friday: defaultDaySchedule,
      saturday: { ...defaultDaySchedule, closeTime: '14:00', lunchStart: '', lunchEnd: '' },
      sunday: { isOpen: false, openTime: '', closeTime: '', lunchStart: '', lunchEnd: '' }
    }
  );

  useEffect(() => {
    if (businessHours) {
      setHours(businessHours);
    }
  }, [businessHours]);

  const handleDayChange = (day: keyof BusinessHours, field: keyof DaySchedule, value: any) => {
    const newHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value
      }
    };
    setHours(newHours);
    onChange(newHours);
  };

  const copyToAllDays = (sourceDay: keyof BusinessHours) => {
    const sourceDaySchedule = hours[sourceDay];
    const newHours = { ...hours };
    
    Object.keys(newHours).forEach((day) => {
      newHours[day as keyof BusinessHours] = { ...sourceDaySchedule };
    });
    
    setHours(newHours);
    onChange(newHours);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Horarios del Local</h3>
      </div>

      <div className="space-y-4">
        {Object.entries(dayNames).map(([dayKey, dayLabel]) => {
          const day = dayKey as keyof BusinessHours;
          const schedule = hours[day];

          return (
            <div key={day} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.isOpen}
                      onChange={(e) => handleDayChange(day, 'isOpen', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 font-medium text-gray-900">{dayLabel}</span>
                  </label>
                </div>
                
                {schedule.isOpen && (
                  <button
                    type="button"
                    onClick={() => copyToAllDays(day)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Copiar a todos los días
                  </button>
                )}
              </div>

              {schedule.isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Horario de apertura y cierre */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Horario de Atención
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.openTime}
                        onChange={(e) => handleDayChange(day, 'openTime', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="time"
                        value={schedule.closeTime}
                        onChange={(e) => handleDayChange(day, 'closeTime', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Horario de colación */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Horario de Colación (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.lunchStart}
                        onChange={(e) => handleDayChange(day, 'lunchStart', e.target.value)}
                        placeholder="Inicio"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="time"
                        value={schedule.lunchEnd}
                        onChange={(e) => handleDayChange(day, 'lunchEnd', e.target.value)}
                        placeholder="Fin"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      No se podrán reservar citas durante este horario
                    </p>
                  </div>
                </div>
              )}

              {!schedule.isOpen && (
                <p className="text-sm text-gray-500 italic">Cerrado</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Los horarios configurados aquí determinan cuándo los clientes pueden reservar citas. 
          Los slots se generan cada 30 minutos dentro del horario de atención, excluyendo el horario de colación.
        </p>
      </div>
    </div>
  );
};

export default BusinessHoursForm;
