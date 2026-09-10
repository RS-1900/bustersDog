import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { useProductStore } from "../stores/useProductStore";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const products = useProductStore((state) => state.products);
  const toggleFavorite = useProductStore((state) => state.toggleFavorite);
  const addToCart = useProductStore((state) => state.addToCart);
  const [selectedSize, setSelectedSize] = useState('M');

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
        <View style={styles.productImageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>

        {/* contenedor de info del producto */}
        <View style={styles.detailsCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.name}</Text>
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

          {product.category === 'bebida' && (
            <View style={styles.sizeSection}>
              <Text style={styles.sectionTitle}>Tamaño</Text>
              <View style={styles.sizeOptions}>
                {['S', 'M', 'L'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeOption, selectedSize === size && styles.sizeOptionSelected]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextSelected]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.purchaseRow}>
            <View>
              <Text style={styles.purchaseLabel}>Precio</Text>
              <Text style={styles.purchasePrice}>${product.price}</Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, product.available === false && styles.addButtonDisabled]}
              disabled={product.available === false}
              onPress={() => {
                addToCart(product.id);
                Alert.alert('Producto agregado', `${product.name} se agregó al carrito.`);
              }}
            >
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
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
  productImageContainer: {
    width: '100%',
    maxWidth: 420,
    height: 290,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#F7F7F7',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  sizeSection: {
    marginTop: 14,
  },
  sizeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeOption: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sizeOptionSelected: {
    borderColor: '#FFAE34',
    backgroundColor: '#FFF8EC',
  },
  sizeText: {
    fontSize: 14,
    color: '#383838',
  },
  sizeTextSelected: {
    color: '#D8830A',
    fontWeight: '700',
  },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  purchaseLabel: {
    fontSize: 18,
    color: '#A0A0A0',
  },
  purchasePrice: {
    fontSize: 26,
    color: '#FFAE34',
    marginTop: 2,
  },
  addButton: {
    minWidth: 125,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFAE34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D1D1D1',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  notFoundText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#8E8E93',
  },
});