<?php
/**
 * `wp elen seed_products` — creates the 5 sample coffee products.
 * WP-CLI only (never runs on a public request), idempotent by SKU.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

final class ELEN_Seed_Products_Command {

	/**
	 * Seed the 5 sample ELEN Coffee products.
	 *
	 * ## EXAMPLES
	 *
	 *     wp elen seed_products
	 */
	public function __invoke( $args, $assoc_args ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			WP_CLI::error( 'WooCommerce must be active.' );
		}

		foreach ( self::products() as $data ) {
			$existing_id = wc_get_product_id_by_sku( $data['sku'] );
			if ( $existing_id ) {
				WP_CLI::log( "Skipping {$data['sku']} — already exists (#{$existing_id})." );
				continue;
			}

			$product = new WC_Product_Simple();
			$product->set_name( $data['name'] );
			$product->set_status( 'publish' );
			$product->set_catalog_visibility( 'visible' );
			$product->set_description( $data['description'] );
			$product->set_short_description( $data['short_description'] );
			$product->set_sku( $data['sku'] );
			$product->set_regular_price( $data['price'] );
			if ( ! empty( $data['sale_price'] ) ) {
				$product->set_sale_price( $data['sale_price'] );
			}
			$product->set_manage_stock( true );
			$product->set_stock_quantity( $data['stock'] );
			$product->set_stock_status( $data['stock'] > 0 ? 'instock' : 'outofstock' );
			$product->set_weight( $data['weight'] );

			$attributes = array();
			foreach ( array( 'roast', 'grind', 'origin' ) as $slug ) {
				if ( empty( $data[ $slug ] ) ) {
					continue;
				}
				$taxonomy = wc_attribute_taxonomy_name( $slug );
				if ( ! taxonomy_exists( $taxonomy ) ) {
					continue;
				}
				$term = term_exists( $data[ $slug ], $taxonomy );
				if ( ! $term ) {
					$term = wp_insert_term( $data[ $slug ], $taxonomy );
				}

				$attribute = new WC_Product_Attribute();
				$attribute->set_id( wc_attribute_taxonomy_id_by_name( $slug ) );
				$attribute->set_name( $taxonomy );
				$attribute->set_options( array( is_array( $term ) ? $term['term_id'] : $term ) );
				$attribute->set_visible( true );
				$attributes[] = $attribute;
			}
			if ( $attributes ) {
				$product->set_attributes( $attributes );
			}

			$product_id = $product->save();

			foreach ( array( 'roast', 'grind', 'origin' ) as $slug ) {
				if ( empty( $data[ $slug ] ) ) {
					continue;
				}
				wp_set_object_terms( $product_id, $data[ $slug ], wc_attribute_taxonomy_name( $slug ), false );
			}

			update_post_meta( $product_id, '_elen_flavor_notes', $data['flavor_notes'] );
			update_post_meta( $product_id, '_elen_brewing_method', $data['brewing_method'] );

			WP_CLI::success( "Created {$data['name']} (#{$product_id})." );
		}
	}

	private static function products() {
		return array(
			array(
				'name'               => 'Yirgacheffe Sunrise',
				'sku'                => 'ELEN-ETH-001',
				'price'              => '295000',
				'sale_price'         => '',
				'stock'              => 40,
				'weight'             => '0.25',
				'roast'              => 'Light',
				'grind'              => 'Whole Bean',
				'origin'             => 'Ethiopia',
				'flavor_notes'       => 'Jasmine, bergamot, peach, honeyed finish',
				'brewing_method'     => "V60 Pour-over\n15g coffee : 250ml water (94°C)\nBloom 30s, total brew 2:30–3:00",
				'short_description'  => 'A bright, floral single-origin from the Yirgacheffe highlands — our lightest roast, best for pour-over.',
				'description'        => 'Grown above 1,900m in the Gedeo Zone, this washed-process Heirloom lot is roasted light to preserve its jasmine and stone-fruit character. A cup for slow mornings and manual brewing.',
			),
			array(
				'name'               => 'Huila Reserve',
				'sku'                => 'ELEN-COL-002',
				'price'              => '275000',
				'sale_price'         => '245000',
				'stock'              => 55,
				'weight'             => '0.25',
				'roast'              => 'Medium',
				'grind'              => 'Filter',
				'origin'             => 'Colombia',
				'flavor_notes'       => 'Red apple, brown sugar, milk chocolate',
				'brewing_method'     => "Filter / Batch brew\n60g coffee per 1L water, 92°C\nTotal brew 4:00",
				'short_description'  => 'A balanced, crowd-pleasing Colombian with a silky chocolate finish.',
				'description'        => 'Sourced from smallholder farms in Huila and washed at a communal wet mill, this medium roast delivers the classic Colombian balance of sweetness, body, and clean acidity.',
			),
			array(
				'name'               => 'Cerrado Noir',
				'sku'                => 'ELEN-BRA-003',
				'price'              => '260000',
				'sale_price'         => '',
				'stock'              => 60,
				'weight'             => '0.25',
				'roast'              => 'Dark',
				'grind'              => 'Espresso',
				'origin'             => 'Brazil',
				'flavor_notes'       => 'Roasted hazelnut, dark cocoa, low acidity',
				'brewing_method'     => "Espresso\n18g in, 36g out, 25–28s extraction",
				'short_description'  => 'A dense, nutty Brazilian roasted dark for espresso — heavy body, sweet crema.',
				'description'        => 'Natural-processed Mundo Novo and Catuaí from the Cerrado plateau, roasted dark for a full-bodied, low-acid espresso shot with a naturally sweet, nutty finish.',
			),
			array(
				'name'               => 'Antigua Highland',
				'sku'                => 'ELEN-GUA-004',
				'price'              => '310000',
				'sale_price'         => '',
				'stock'              => 30,
				'weight'             => '0.25',
				'roast'              => 'Medium-Dark',
				'grind'              => 'French Press',
				'origin'             => 'Guatemala',
				'flavor_notes'       => 'Dark chocolate, dried cherry, hint of spice',
				'brewing_method'     => "French Press\n30g coffee : 500ml water (96°C)\nSteep 4:00, plunge slowly",
				'short_description'  => 'Volcanic-soil grown, full-bodied, with a spiced-chocolate finish that suits full-immersion brewing.',
				'description'        => 'Grown in the volcanic soils of the Antigua Valley at high altitude, this lot is roasted medium-dark for a syrupy body and layered notes of chocolate, dried fruit, and warm spice.',
			),
			array(
				'name'               => 'Nyeri Peak',
				'sku'                => 'ELEN-KEN-005',
				'price'              => '330000',
				'sale_price'         => '',
				'stock'              => 25,
				'weight'             => '0.25',
				'roast'              => 'Light',
				'grind'              => 'Filter',
				'origin'             => 'Kenya',
				'flavor_notes'       => 'Blackcurrant, tomato, bright citrus acidity',
				'brewing_method'     => "V60 Pour-over\n16g coffee : 260ml water (95°C)\nBloom 30s, total brew 2:45",
				'short_description'  => 'A vivid, wine-like Kenyan with signature blackcurrant acidity — for those who love intensity.',
				'description'        => 'From the SL28/SL34 varietals grown near Mount Kenya, double-fermented and washed for exceptional clarity. Expect the vivid blackcurrant acidity Kenyan coffee is known for.',
			),
		);
	}
}

WP_CLI::add_command( 'elen seed_products', 'ELEN_Seed_Products_Command' );
