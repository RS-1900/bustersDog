import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Product } from '../types/product';
import { useProductStore } from '../stores/useProductStore';





type ProductCardProps = {
  product: Product;
  onFavoritePress?: (id: string) => void;
};
export function ProductCard({ product }: ProductCardProps) {
  const toggleFavorite = useProductStore((state) => state.toggleFavorite);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardWrapper}
      onPress={() => router.push(`/products/${product.id}`)}
    >
      <View style={styles.cardBackground}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            ${product.price}
          </Text>

          <TouchableOpacity 
            style={styles.heartButton} 
            onPress={(e) => {
              e.stopPropagation(); // para q al darle click en fav no se abra la card
              toggleFavorite(product.id);
            }}
          >
            <Text style={[styles.heartIcon, product.isFavorite && styles.heartIconActive]}>
              {product.isFavorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Image source={{ uri: product.image }} style={styles.cardImage} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
cardWrapper: {
    width: '46%',
    marginTop: 65,
    marginBottom: 20,
    alignItems: 'center',
  },
    gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardBackground: {
    backgroundColor: '#FFAE34',
    width: '100%',
    height:200, //el largo d la tarjeta amarilla
    borderRadius: 25,
    paddingTop: 80,
    paddingHorizontal: 12,
    paddingBottom: 15,
    justifyContent: 'center',
  },
cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
cardFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7A3E00',
    textAlign: 'center',
  },
heartButton: {
    width: 24,
    alignItems: 'flex-end',
  },
heartIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  heartIconActive: {
    color: '#E0245E', //si se le da click a fav
  },
cardImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    position: 'absolute',
    top: -55,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});

export default ProductCard;