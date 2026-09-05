<?php
/**
 * JSON-LD structured data. Single source of truth (WooCommerce's own
 * structured-data module is disabled in class-seo.php) so there is never
 * a duplicate/conflicting Product schema on a page.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_Schema {

	public static function init() {
		add_action( 'wp_footer', array( __CLASS__, 'output' ) );
	}

	public static function output() {
		$graphs = array( self::organization(), self::website() );

		$breadcrumb = self::breadcrumb();
		if ( $breadcrumb ) {
			$graphs[] = $breadcrumb;
		}

		if ( is_singular( 'product' ) ) {
			$product_schema = self::product();
			if ( $product_schema ) {
				$graphs[] = $product_schema;
			}
		}

		$graphs = array_filter( $graphs );
		if ( empty( $graphs ) ) {
			return;
		}

		echo '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => array_values( $graphs ) ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
	}

	private static function organization() {
		return array(
			'@type' => 'Organization',
			'@id'   => home_url( '/#organization' ),
			'name'  => get_bloginfo( 'name' ),
			'url'   => home_url( '/' ),
			'logo'  => has_site_icon() ? get_site_icon_url() : '',
			'sameAs' => array_values( array_filter( (array) apply_filters( 'elen_social_links', array() ) ) ),
		);
	}

	private static function website() {
		return array(
			'@type'           => 'WebSite',
			'@id'             => home_url( '/#website' ),
			'url'             => home_url( '/' ),
			'name'            => get_bloginfo( 'name' ),
			'publisher'       => array( '@id' => home_url( '/#organization' ) ),
			'potentialAction' => array(
				'@type'       => 'SearchAction',
				'target'      => home_url( '/?s={search_term_string}' ),
				'query-input' => 'required name=search_term_string',
			),
		);
	}

	private static function breadcrumb() {
		if ( is_front_page() ) {
			return null;
		}

		$items = array(
			array( 'name' => get_bloginfo( 'name' ), 'item' => home_url( '/' ) ),
		);

		if ( function_exists( 'is_shop' ) && ( is_shop() || is_product_category() || is_product_tag() ) ) {
			$items[] = array( 'name' => __( 'Shop', 'elen-coffee' ), 'item' => get_permalink( wc_get_page_id( 'shop' ) ) );
			if ( is_product_category() || is_product_tag() ) {
				$term     = get_queried_object();
				$items[]  = array( 'name' => $term->name, 'item' => get_term_link( $term ) );
			}
		} elseif ( is_singular( 'product' ) ) {
			$items[] = array( 'name' => __( 'Shop', 'elen-coffee' ), 'item' => get_permalink( wc_get_page_id( 'shop' ) ) );
			$items[] = array( 'name' => get_the_title(), 'item' => get_permalink() );
		} elseif ( is_singular() ) {
			$items[] = array( 'name' => get_the_title(), 'item' => get_permalink() );
		}

		$list = array();
		foreach ( $items as $position => $item ) {
			$list[] = array(
				'@type'    => 'ListItem',
				'position' => $position + 1,
				'name'     => $item['name'],
				'item'     => $item['item'],
			);
		}

		return array(
			'@type'           => 'BreadcrumbList',
			'itemListElement' => $list,
		);
	}

	private static function product() {
		global $product;
		if ( ! $product instanceof WC_Product ) {
			$product = wc_get_product( get_the_ID() );
		}
		if ( ! $product ) {
			return null;
		}

		$image_id  = $product->get_image_id();
		$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'elen-product-zoom' ) : wc_placeholder_img_src();

		$availability = 'https://schema.org/OutOfStock';
		if ( $product->is_in_stock() ) {
			$availability = $product->is_on_backorder() ? 'https://schema.org/BackOrder' : 'https://schema.org/InStock';
		}

		$data = array(
			'@type'       => 'Product',
			'name'        => $product->get_name(),
			'description' => wp_strip_all_tags( $product->get_short_description() ?: $product->get_description() ),
			'sku'         => $product->get_sku(),
			'image'       => $image_url,
			'url'         => get_permalink( $product->get_id() ),
			'brand'       => array(
				'@type' => 'Brand',
				'name'  => get_bloginfo( 'name' ),
			),
			'offers'      => array(
				'@type'         => 'Offer',
				'url'           => get_permalink( $product->get_id() ),
				'priceCurrency' => get_woocommerce_currency(),
				'price'         => $product->get_price(),
				'availability'  => $availability,
			),
		);

		$reviews_count = (int) $product->get_review_count();
		if ( $reviews_count > 0 ) {
			$data['aggregateRating'] = array(
				'@type'       => 'AggregateRating',
				'ratingValue' => $product->get_average_rating(),
				'reviewCount' => $reviews_count,
			);
		}

		return $data;
	}
}

ELEN_Schema::init();
