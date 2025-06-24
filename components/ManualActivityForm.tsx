import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Zap, 
  Heart, 
  MessageSquare,
  Award,
  Cloud,
  Save,
  X
} from 'lucide-react-native';
import { ActivityFormData } from '@/hooks/useManualActivities';

interface ManualActivityFormProps {
  onSubmit: (data: ActivityFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const activityTypes = [
  'Running',
  'Walking', 
  'Cycling',
  'Swimming',
  'Strength Training',
  'Yoga',
  'Other'
];

const weatherConditions = [
  'Sunny',
  'Cloudy',
  'Rainy',
  'Windy',
  'Snow'
];

const achievementFlags = [
  'Personal Record',
  'First Time Activity',
  'Longest Duration',
  'Fastest Pace'
];

const intensityLabels = ['Light', 'Moderate', 'Vigorous', 'High', 'Maximum'];

const validationSchema = yup.object().shape({
  activity_type: yup.string().required('Activity type is required'),
  activity_name: yup.string().required('Activity name is required'),
  activity_date: yup.date()
    .required('Date is required')
    .max(new Date(), 'Date cannot be in the future')
    .min(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'Date cannot be more than 90 days ago'),
  start_time: yup.date().required('Start time is required'),
  end_time: yup.date()
    .required('End time is required')
    .min(yup.ref('start_time'), 'End time must be after start time'),
  distance_km: yup.number()
    .nullable()
    .min(0.1, 'Distance must be at least 0.1km')
    .max(500, 'Distance seems unrealistic'),
  calories_burned: yup.number()
    .nullable()
    .min(50, 'Calories must be at least 50')
    .max(2000, 'Calories must be less than 2000'),
  average_heart_rate: yup.number()
    .nullable()
    .min(60, 'Heart rate must be at least 60 BPM')
    .max(200, 'Heart rate must be less than 200 BPM'),
  intensity_level: yup.number()
    .min(1, 'Intensity level is required')
    .max(5, 'Intensity level must be between 1-5'),
  notes: yup.string().max(500, 'Notes must be less than 500 characters'),
});

export default function ManualActivityForm({ onSubmit, onCancel, loading }: ManualActivityFormProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ActivityFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      activity_date: new Date(),
      start_time: new Date(),
      end_time: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes later
      intensity_level: 3,
      achievement_flags: [],
    },
    mode: 'onBlur',
  });

  const watchedActivityType = watch('activity_type');
  const watchedStartTime = watch('start_time');
  const watchedEndTime = watch('end_time');

  // Calculate duration
  const duration = watchedEndTime && watchedStartTime 
    ? Math.floor((watchedEndTime.getTime() - watchedStartTime.getTime()) / 1000 / 60)
    : 0;

  const isDistanceBasedActivity = ['Running', 'Walking', 'Cycling', 'Swimming'].includes(watchedActivityType);

  const handleFormSubmit = async (data: ActivityFormData) => {
    try {
      await onSubmit({
        ...data,
        achievement_flags: selectedAchievements,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    }
  };

  const toggleAchievement = (achievement: string) => {
    setSelectedAchievements(prev => 
      prev.includes(achievement)
        ? prev.filter(a => a !== achievement)
        : [...prev, achievement]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Activity</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Activity Type */}
      <View style={styles.section}>
        <Text style={styles.label}>Activity Type *</Text>
        <Controller
          control={control}
          name="activity_type"
          render={({ field: { onChange, value } }) => (
            <View style={styles.activityTypeGrid}>
              {activityTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.activityTypeButton,
                    value === type && styles.activityTypeButtonSelected,
                  ]}
                  onPress={() => onChange(type)}
                >
                  <Text
                    style={[
                      styles.activityTypeText,
                      value === type && styles.activityTypeTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.activity_type && (
          <Text style={styles.errorText}>{errors.activity_type.message}</Text>
        )}
      </View>

      {/* Activity Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Activity Name *</Text>
        <Controller
          control={control}
          name="activity_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.activity_name && styles.inputError]}
              placeholder="e.g., Morning Run in Central Park"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.activity_name && (
          <Text style={styles.errorText}>{errors.activity_name.message}</Text>
        )}
      </View>

      {/* Date and Time */}
      <View style={styles.section}>
        <Text style={styles.label}>Date & Time *</Text>
        
        <Controller
          control={control}
          name="activity_date"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {value.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.timeRow}>
          <Controller
            control={control}
            name="start_time"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={[styles.dateTimeButton, styles.timeButton]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Clock size={20} color="#6B7280" />
                <Text style={styles.dateTimeText}>
                  Start: {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            )}
          />

          <Controller
            control={control}
            name="end_time"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={[styles.dateTimeButton, styles.timeButton]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={20} color="#6B7280" />
                <Text style={styles.dateTimeText}>
                  End: {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {duration > 0 && (
          <Text style={styles.durationText}>Duration: {duration} minutes</Text>
        )}

        {errors.start_time && (
          <Text style={styles.errorText}>{errors.start_time.message}</Text>
        )}
        {errors.end_time && (
          <Text style={styles.errorText}>{errors.end_time.message}</Text>
        )}
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.label}>Performance Metrics</Text>
        
        {isDistanceBasedActivity && (
          <Controller
            control={control}
            name="distance_km"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Distance (km)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              </View>
            )}
          />
        )}

        <Controller
          control={control}
          name="calories_burned"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Zap size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Calories burned"
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                onBlur={onBlur}
                keyboardType="numeric"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="average_heart_rate"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <Heart size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Average heart rate (BPM)"
                value={value?.toString() || ''}
                onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                onBlur={onBlur}
                keyboardType="numeric"
              />
            </View>
          )}
        />

        {errors.distance_km && (
          <Text style={styles.errorText}>{errors.distance_km.message}</Text>
        )}
        {errors.calories_burned && (
          <Text style={styles.errorText}>{errors.calories_burned.message}</Text>
        )}
        {errors.average_heart_rate && (
          <Text style={styles.errorText}>{errors.average_heart_rate.message}</Text>
        )}
      </View>

      {/* Intensity Level */}
      <View style={styles.section}>
        <Text style={styles.label}>Intensity Level *</Text>
        <Controller
          control={control}
          name="intensity_level"
          render={({ field: { onChange, value } }) => (
            <View style={styles.intensityContainer}>
              {intensityLabels.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.intensityButton,
                    value === index + 1 && styles.intensityButtonSelected,
                  ]}
                  onPress={() => onChange(index + 1)}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      value === index + 1 && styles.intensityTextSelected,
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <Text style={styles.intensityLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      </View>

      {/* Weather */}
      <View style={styles.section}>
        <Text style={styles.label}>Weather Conditions</Text>
        <Controller
          control={control}
          name="weather_conditions"
          render={({ field: { onChange, value } }) => (
            <View style={styles.weatherContainer}>
              {weatherConditions.map((weather) => (
                <TouchableOpacity
                  key={weather}
                  style={[
                    styles.weatherButton,
                    value === weather && styles.weatherButtonSelected,
                  ]}
                  onPress={() => onChange(value === weather ? undefined : weather)}
                >
                  <Cloud size={16} color={value === weather ? "#FFFFFF" : "#6B7280"} />
                  <Text
                    style={[
                      styles.weatherText,
                      value === weather && styles.weatherTextSelected,
                    ]}
                  >
                    {weather}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      </View>

      {/* Achievement Flags */}
      <View style={styles.section}>
        <Text style={styles.label}>Achievement Flags</Text>
        <View style={styles.achievementContainer}>
          {achievementFlags.map((achievement) => (
            <TouchableOpacity
              key={achievement}
              style={[
                styles.achievementButton,
                selectedAchievements.includes(achievement) && styles.achievementButtonSelected,
              ]}
              onPress={() => toggleAchievement(achievement)}
            >
              <Award 
                size={16} 
                color={selectedAchievements.includes(achievement) ? "#FFFFFF" : "#6B7280"} 
              />
              <Text
                style={[
                  styles.achievementText,
                  selectedAchievements.includes(achievement) && styles.achievementTextSelected,
                ]}
              >
                {achievement}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.label}>Notes</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <MessageSquare size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon, styles.notesInput]}
                placeholder="How did it feel? Any observations?"
                value={value || ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          )}
        />
        {errors.notes && (
          <Text style={styles.errorText}>{errors.notes.message}</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!isValid || loading) && styles.submitButtonDisabled]}
        onPress={handleSubmit(handleFormSubmit)}
        disabled={!isValid || loading}
      >
        <Save size={20} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>
          {loading ? 'Saving...' : 'Save Activity'}
        </Text>
      </TouchableOpacity>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <Controller
          control={control}
          name="activity_date"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value || ''}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) onChange(selectedDate);
              }}
              maximumDate={new Date()}
              minimumDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
            />
          )}
        />
      )}

      {showStartTimePicker && (
        <Controller
          control={control}
          name="start_time"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value || ''}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowStartTimePicker(false);
                if (selectedTime) {
                  onChange(selectedTime);
                  // Auto-adjust end time to be 30 minutes later
                  const endTime = new Date(selectedTime.getTime() + 30 * 60 * 1000);
                  setValue('end_time', endTime);
                }
              }}
            />
          )}
        />
      )}

      {showEndTimePicker && (
        <Controller
          control={control}
          name="end_time"
          render={({ field: { onChange, value } }) => (
            <DateTimePicker
              value={value || ''}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowEndTimePicker(false);
                if (selectedTime) onChange(selectedTime);
              }}
            />
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  activityTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  activityTypeButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  activityTypeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activityTypeTextSelected: {
    color: '#FFFFFF',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    flex: 1,
  },
  durationText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 60,
  },
  intensityButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  intensityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  intensityTextSelected: {
    color: '#FFFFFF',
  },
  intensityLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  weatherContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weatherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  weatherButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  weatherText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  weatherTextSelected: {
    color: '#FFFFFF',
  },
  achievementContainer: {
    gap: 8,
  },
  achievementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  achievementButtonSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  achievementText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  achievementTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});