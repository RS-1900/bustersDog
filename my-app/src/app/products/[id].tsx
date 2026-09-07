import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { useProductStore } from "../stores/useProductStore";
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const products = useProductStore((state) => state.products);
  const toggleFavorite = useProductStore((state) => state.toggleFavorite);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFoundText}>Producto no encontrado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFavorite(product.id)}>
          <Text style={[styles.heartIcon, product.isFavorite && styles.heartIconActive]}>
            {product.isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* imd de producto */}
        <Image source={{ uri: product.image }} style={styles.productImage} />

        {/* contenedor de info del producto */}
        <View style={styles.detailsCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.price}>${product.price}</Text>
          </View>

          {/* disponibilidad iconito */}
          <View style={styles.availabilityBadge}>
            <Text
              style={[
                styles.availabilityText,
                product.available === false && styles.unavailableText,
              ]}
            >
              ● {product.available !== false ? 'Disponible' : 'Agotado'}
            </Text>
          </View>

          {/* descripcion de producto */}
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            {product.description || 'Delicioso producto elaborado con ingredientes frescos de alta calidad.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 24,
    color: '#C87D0E',
    fontWeight: 'bold',
  },
  heartIcon: {
    fontSize: 24,
    color: '#8E8E93',
  },
  heartIconActive: {
    color: '#E0245E',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  productImage: {
    width: 380,
    height: 290,
    resizeMode: 'contain',
    marginVertical: 10,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c85f0e', //color del precio dentro d la carta
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 12,
  },
  availabilityText: {
    color: '#137333',
    fontWeight: '600',
    fontSize: 12,
  },
  unavailableText: {
    color: '#D93025',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 10,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#636366',
    lineHeight: 20,
  },
  notFoundText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#8E8E93',
  },
});