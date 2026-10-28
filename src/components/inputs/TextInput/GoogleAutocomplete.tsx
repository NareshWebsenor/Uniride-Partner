import { logger } from '@/utils/logger';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { themeType } from '@/interface/theme.type';
import { fontFamily, fontSize, Ionicons } from '@/utils/fontIcon.utils';
import { GOOGLE_API_KEY } from '@/service/config';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColor } from '@/hooks/useThemeColor';

type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

export type PlaceDetails = {
  place_id: string;
  description: string;
  title: string;
  subtitle: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  photo_url?: string;
};

type props = {
  onChangeText?: (text: string) => void;
  onPlaceSelected?: (place: PlaceDetails) => void;
  style?: ViewStyle;
  inputStyle?: any;
  inputContainerStyle?: ViewStyle;
  placeHolder?: string;
  debounceMs?: number;
  minLength?: number;
  fetchDetails?: boolean;
  renderAbove?: boolean;
};

export default function GoogleAutocomplete({
  onChangeText,
  onPlaceSelected,
  placeHolder,
  style,
  inputStyle,
  inputContainerStyle,
  debounceMs = 300,
  minLength = 2,
  fetchDetails = true,
  renderAbove = false,
}: props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const themeColor = useThemeColor();

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Use a ref to track if component is mounted to prevent state updates on unmount
  const isMounted = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || input.length < minLength) {
        if (isMounted.current) {
          setPredictions([]);
          setShowPredictions(false);
        }
        return;
      }

      if (isMounted.current) setLoading(true);

      try {
        if (!GOOGLE_API_KEY) {
          logger.warn('places.configuration_missing', { scope: 'ui' });
          return;
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input,
          )}&key=${GOOGLE_API_KEY}&language=en`,
        );
        const data = await response.json();

        if (isMounted.current) {
          if (data.status === 'OK' && data.predictions) {
            setPredictions(data.predictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            if (data.status !== 'ZERO_RESULTS') {
              logger.warn('places.predictions_failed', { scope: 'ui' });
            }
          }
        }
      } catch {
        logger.error('places.predictions_failed', { scope: 'ui' });
        if (isMounted.current) setPredictions([]);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [minLength],
  );

  const fetchPlaceDetails = useCallback(
    async (prediction: PlacePrediction) => {
      if (!fetchDetails) {
        onPlaceSelected?.({
          place_id: prediction.place_id,
          description: prediction.description,
          title: prediction.structured_formatting.main_text,
          subtitle: prediction.structured_formatting.secondary_text,
          location: { latitude: 0, longitude: 0 }, // Default or handle optional
        });
        return;
      }

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_API_KEY}`,
        );
        const data = await response.json();

        if (data.result && data.result.geometry) {
          const addressComponents = data.result.address_components || [];
          let city = '';
          let state = '';
          let country = '';
          let countryCode = '';

          addressComponents.forEach((component: any) => {
            const types = component.types;
            if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
              countryCode = component.short_name;
            }
          });

          // Fallback for city if locality is missing
          if (!city) {
            addressComponents.forEach((component: any) => {
              if (component.types.includes('sublocality_level_1')) {
                city = component.long_name;
              }
            });
          }

          const photoUrl =
            data.result.photos && data.result.photos.length > 0
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1000&photoreference=${data.result.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : undefined;

          onPlaceSelected?.({
            place_id: prediction.place_id,
            description: prediction.description,
            title: prediction.structured_formatting.main_text,
            subtitle: prediction.structured_formatting.secondary_text,
            location: {
              latitude: data.result.geometry.location.lat,
              longitude: data.result.geometry.location.lng,
            },
            city,
            state,
            country,
            countryCode,
            photo_url: photoUrl,
          });
        }
      } catch {
        logger.error('places.details_failed', { scope: 'ui' });
      }
    },
    [fetchDetails, onPlaceSelected],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      onChangeText?.(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchPredictions(text);
      }, debounceMs);
    },
    [debounceMs, fetchPredictions, onChangeText],
  );

  const handlePredictionPress = useCallback(
    (prediction: PlacePrediction) => {
      setSearchQuery(prediction.description);
      setShowPredictions(false);
      setPredictions([]);
      Keyboard.dismiss();
      fetchPlaceDetails(prediction);
    },
    [fetchPlaceDetails],
  );

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setPredictions([]);
    setShowPredictions(false);
    onChangeText?.('');
    Keyboard.dismiss();
  }, [onChangeText]);

  const renderPrediction = useCallback(
    ({ item }: { item: PlacePrediction }) => (
      <TouchableOpacity
        style={styles.predictionItem}
        onPress={() => handlePredictionPress(item)}
      >
        <Ionicons
          name="location-outline"
          size={fontSize.f20}
          color={themeColor.primary}
          style={styles.locationIcon}
        />
        <View style={styles.predictionTextContainer}>
          <Text style={styles.mainText}>
            {item.structured_formatting.main_text}
          </Text>
          <Text style={styles.secondaryText}>
            {item.structured_formatting.secondary_text}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handlePredictionPress, styles, themeColor.primary],
  );

  return (
    <View style={[styles.container, style]}>
      {renderAbove && showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainerAbove}>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={item => item.place_id}
            style={styles.predictionsList}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={5}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <View style={[styles.searchContainer]}>
        <View style={[styles.inputContainer, inputContainerStyle]}>
          <Ionicons
            name="search"
            size={fontSize.f20}
            color={themeColor.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={handleTextChange}
            placeholder={placeHolder ?? t('ui.searchLocation')}
            style={[styles.input, inputStyle]}
            placeholderTextColor={themeColor.placeHolderColor}
            onFocus={() => {
              if (predictions.length > 0) {
                setShowPredictions(true);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator
              size="small"
              color={themeColor.primary}
              style={styles.loader}
            />
          )}
          {searchQuery.length > 0 && !loading && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={fontSize.f20}
                color={themeColor.placeHolderColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!renderAbove && showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={item => item.place_id}
            style={styles.predictionsList}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={5}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const createStyle = (themeColor: themeType) =>
  StyleSheet.create({
    container: {
      zIndex: 1,
      width: '100%',
      position: 'relative',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    input: {
      flex: 1,
      fontSize: fontSize.f14,
      fontFamily: fontFamily.regular,
      color: themeColor.text,
      height: 50,
      paddingHorizontal: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      borderRadius: 30, // Updated for simpler search bar like usual Google Inputs
      paddingHorizontal: 15,
      backgroundColor: themeColor.grayS3,
      borderColor: themeColor.grayS1,
      // Added minimal shadow for depth if needed, or remove if flat style desired.
      // borderWidth: 1,
    },
    searchIcon: {
      marginRight: 4,
    },
    loader: {
      marginHorizontal: 8,
    },
    predictionsContainer: {
      marginTop: 8,
      backgroundColor: themeColor.surface, // Usually white background looks cleaner for dropdowns
      borderRadius: 12,
      shadowColor: themeColor.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      // shadowOpacity: 0.1,
      // shadowRadius: 12,
      // elevation: 5,
      overflow: 'hidden', // Contain list border radius
    },
    predictionsContainerAbove: {
      backgroundColor: themeColor.surface,
      borderRadius: 12,
      shadowColor: themeColor.shadow,
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
      position: 'absolute',
      bottom: '100%',
      width: '100%',
      maxHeight: 250,
      zIndex: 1000,
    },
    predictionsList: {
      // paddingVertical: 5,
    },
    predictionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColor.border,
    },
    locationIcon: {
      marginRight: 12,
      opacity: 0.7,
    },
    predictionTextContainer: {
      flex: 1,
    },
    mainText: {
      fontSize: fontSize.f14,
      fontFamily: fontFamily.medium,
      color: themeColor.text,
      marginBottom: 2,
    },
    secondaryText: {
      fontSize: fontSize.f12,
      fontFamily: fontFamily.regular,
      color: themeColor.gray,
    },
  });
