<?php
/**
 * Technical SEO. No SEO plugin: WordPress core already ships an XML
 * sitemap (wp-sitemap.xml) and clean permalinks; the pieces core doesn't
 * cover — meta description, canonical, Open Graph, robots meta — are
 * small enough to own directly and avoids a heavy plugin's admin UI,
 * database tables, and extra queries on every request.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_SEO {

	public static function init() {
		add_action( 'wp_head', array( __CLASS__, 'meta_description' ), 1 );
		add_action( 'wp_head', array( __CLASS__, 'canonical' ), 1 );
		add_action( 'wp_head', array( __CLASS__, 'robots_meta' ), 1 );
		add_action( 'wp_head', array( __CLASS__, 'open_graph' ), 2 );
		add_filter( 'document_title_separator', array( __CLASS__, 'title_separator' ) );
		add_filter( 'wp_sitemaps_enabled', '__return_true' );
		add_filter( 'wp_sitemaps_post_types', array( __CLASS__, 'sitemap_include_products' ) );
		add_filter( 'the_content', array( __CLASS__, 'force_image_alt' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'wc_seo_cleanup' ) );
		add_filter( 'robots_txt', array( __CLASS__, 'robots_txt' ), 10, 2 );
	}

	/**
	 * WordPress core serves a virtual robots.txt (no physical file needed)
	 * and already disallows /wp-admin/ except admin-ajax.php; we only add
	 * the sitemap pointer and keep checkout/cart out of it as a courtesy
	 * to crawlers (they're already noindex via robots meta above).
	 */
	public static function robots_txt( $output, $public ) {
		if ( '1' !== (string) $public ) {
			return $output;
		}
		$output .= "Disallow: /cart/\n";
		$output .= "Disallow: /checkout/\n";
		$output .= 'Sitemap: ' . home_url( '/wp-sitemap.xml' ) . "\n";
		return $output;
	}

	private static function description() {
		if ( is_singular() ) {
			global $post;
			$excerpt = has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_strip_all_tags( $post->post_content );
			return wp_trim_words( $excerpt, 30, '…' );
		}
		if ( function_exists( 'is_shop' ) && is_shop() ) {
			return __( 'Shop specialty ELEN coffee — single-origin beans, small-batch roasted, shipped fresh.', 'elen-coffee' );
		}
		if ( is_category() || is_tax() ) {
			return wp_trim_words( wp_strip_all_tags( term_description() ), 30, '…' );
		}
		return get_bloginfo( 'description' );
	}

	public static function meta_description() {
		if ( is_admin() ) {
			return;
		}
		$desc = trim( (string) self::description() );
		if ( $desc ) {
			printf( '<meta name="description" content="%s">' . "\n", esc_attr( $desc ) );
		}
	}

	public static function canonical() {
		if ( is_admin() ) {
			return;
		}
		$url = '';
		if ( is_singular() ) {
			$url = get_permalink();
		} elseif ( is_home() || is_front_page() ) {
			$url = home_url( '/' );
		} elseif ( function_exists( 'is_shop' ) && is_shop() ) {
			$url = get_permalink( wc_get_page_id( 'shop' ) );
		} elseif ( is_category() || is_tax() || is_tag() ) {
			$url = get_term_link( get_queried_object() );
		}
		if ( $url && ! is_wp_error( $url ) ) {
			printf( '<link rel="canonical" href="%s">' . "\n", esc_url( $url ) );
		}
	}

	public static function robots_meta() {
		if ( is_search() || is_404() ) {
			echo '<meta name="robots" content="noindex,follow">' . "\n";
		} elseif ( is_cart() || is_checkout() || is_account_page() ) {
			echo '<meta name="robots" content="noindex,nofollow">' . "\n";
		} else {
			echo '<meta name="robots" content="index,follow,max-image-preview:large">' . "\n";
		}
	}

	public static function open_graph() {
		if ( is_admin() ) {
			return;
		}
		$title = wp_get_document_title();
		$desc  = self::description();
		$image = '';

		if ( is_singular() && has_post_thumbnail() ) {
			$image = get_the_post_thumbnail_url( get_the_ID(), 'elen-hero' );
		} elseif ( has_site_icon() ) {
			$image = get_site_icon_url();
		}

		$type = is_singular( 'product' ) ? 'product' : ( is_singular() ? 'article' : 'website' );

		printf( '<meta property="og:type" content="%s">' . "\n", esc_attr( $type ) );
		printf( '<meta property="og:title" content="%s">' . "\n", esc_attr( $title ) );
		printf( '<meta property="og:description" content="%s">' . "\n", esc_attr( $desc ) );
		printf( '<meta property="og:site_name" content="%s">' . "\n", esc_attr( get_bloginfo( 'name' ) ) );
		printf( '<meta property="og:url" content="%s">' . "\n", esc_url( self::current_url() ) );
		if ( $image ) {
			printf( '<meta property="og:image" content="%s">' . "\n", esc_url( $image ) );
		}
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";

		if ( is_singular( 'product' ) ) {
			global $product;
			if ( ! $product instanceof WC_Product ) {
				$product = wc_get_product( get_the_ID() );
			}
			if ( $product ) {
				printf( '<meta property="product:price:amount" content="%s">' . "\n", esc_attr( $product->get_price() ) );
				printf( '<meta property="product:price:currency" content="%s">' . "\n", esc_attr( get_woocommerce_currency() ) );
			}
		}
	}

	private static function current_url() {
		global $wp;
		return home_url( add_query_arg( array(), $wp->request ) );
	}

	public static function title_separator() {
		return '—';
	}

	public static function sitemap_include_products( $post_types ) {
		return $post_types; // WooCommerce already registers 'product' with the core sitemap; nothing to add/remove.
	}

	public static function force_image_alt( $content ) {
		if ( is_admin() || ! is_string( $content ) ) {
			return $content;
		}
		return preg_replace_callback(
			'/<img((?:(?!alt=)[^>])*)>/i',
			function ( $matches ) {
				return '<img' . $matches[1] . ' alt="' . esc_attr( get_the_title() ) . '">';
			},
			$content
		);
	}

	/**
	 * WooCommerce already prints canonical + basic OG for product pages
	 * when its own structured data module runs; we keep ours as the single
	 * source of truth and disable the duplicate to avoid conflicting tags.
	 */
	public static function wc_seo_cleanup() {
		remove_action( 'wp_head', array( wc()->structured_data, 'output_structured_data' ), 10 );
	}
}

ELEN_SEO::init();
