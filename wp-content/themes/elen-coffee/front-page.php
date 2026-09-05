<?php
/**
 * Premium landing-page home. Section order is the UX decision: Hero →
 * proof-of-craft (featured products) → brand story → philosophy →
 * collection browse → lifestyle → testimonials → CTA/newsletter.
 * Copy/images come from the Customizer so an admin can update them
 * without touching code; structure stays fixed by design intent.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$hero_image    = get_theme_mod( 'elen_hero_image' );
$story_image   = get_theme_mod( 'elen_story_image' );
$shop_url      = function_exists( 'wc_get_page_id' ) ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/' );
?>

<main id="primary" class="site-main">

	<section class="hero" aria-label="<?php esc_attr_e( 'Introduction', 'elen-coffee' ); ?>">
		<div class="hero__media">
			<?php if ( $hero_image ) : ?>
				<img src="<?php echo esc_url( $hero_image ); ?>" alt="" loading="eager" fetchpriority="high">
			<?php endif; ?>
		</div>
		<div class="hero__content container">
			<p class="hero__eyebrow reveal" data-reveal><?php echo esc_html( get_theme_mod( 'elen_hero_eyebrow', __( 'Specialty Coffee, Roasted with Intent', 'elen-coffee' ) ) ); ?></p>
			<h1 class="hero__heading reveal" data-reveal><?php echo esc_html( get_theme_mod( 'elen_hero_heading', __( 'Coffee, slowed down.', 'elen-coffee' ) ) ); ?></h1>
			<p class="hero__subheading reveal" data-reveal><?php echo esc_html( get_theme_mod( 'elen_hero_subheading' ) ); ?></p>
			<div class="hero__actions reveal" data-reveal>
				<a class="btn btn--primary btn--lg" href="<?php echo esc_url( $shop_url ); ?>">
					<?php echo esc_html( get_theme_mod( 'elen_hero_cta_text', __( 'Shop the collection', 'elen-coffee' ) ) ); ?>
				</a>
			</div>
		</div>
	</section>

	<?php if ( class_exists( 'WooCommerce' ) ) : ?>
	<section class="section featured-products" aria-labelledby="featured-heading">
		<div class="container">
			<div class="section__head">
				<h2 id="featured-heading" class="section__title reveal" data-reveal><?php esc_html_e( 'Featured Roasts', 'elen-coffee' ); ?></h2>
				<a class="link-arrow reveal" data-reveal href="<?php echo esc_url( $shop_url ); ?>">
					<?php esc_html_e( 'View all', 'elen-coffee' ); ?> <?php echo elen_icon( 'arrow' ); ?>
				</a>
			</div>
			<div class="product-row reveal-stagger" data-reveal-stagger>
				<?php echo do_shortcode( '[products limit="4" columns="4" visibility="featured" orderby="date"]' ); ?>
			</div>
		</div>
	</section>
	<?php endif; ?>

	<section class="section brand-story" aria-labelledby="story-heading">
		<div class="container brand-story__grid">
			<div class="brand-story__media reveal" data-reveal>
				<?php if ( $story_image ) : ?>
					<img src="<?php echo esc_url( $story_image ); ?>" alt="" loading="lazy" width="1200" height="1500">
				<?php endif; ?>
			</div>
			<div class="brand-story__copy reveal" data-reveal>
				<h2 id="story-heading" class="section__title"><?php echo esc_html( get_theme_mod( 'elen_story_heading' ) ); ?></h2>
				<p><?php echo esc_html( get_theme_mod( 'elen_story_text' ) ); ?></p>
				<a class="link-arrow" href="<?php echo esc_url( home_url( '/about/' ) ); ?>">
					<?php esc_html_e( 'Our story', 'elen-coffee' ); ?> <?php echo elen_icon( 'arrow' ); ?>
				</a>
			</div>
		</div>
	</section>

	<section class="section philosophy" aria-labelledby="philosophy-heading">
		<div class="container philosophy__inner">
			<h2 id="philosophy-heading" class="section__title reveal" data-reveal><?php echo esc_html( get_theme_mod( 'elen_philosophy_heading' ) ); ?></h2>
			<p class="philosophy__text reveal" data-reveal><?php echo esc_html( get_theme_mod( 'elen_philosophy_text' ) ); ?></p>
			<div class="philosophy__pillars reveal-stagger" data-reveal-stagger>
				<div class="pillar">
					<h3><?php esc_html_e( 'Origin', 'elen-coffee' ); ?></h3>
					<p><?php esc_html_e( 'Traceable lots from farms and cooperatives we work with directly.', 'elen-coffee' ); ?></p>
				</div>
				<div class="pillar">
					<h3><?php esc_html_e( 'Roast', 'elen-coffee' ); ?></h3>
					<p><?php esc_html_e( 'Small batches, roasted to highlight each origin\'s natural character.', 'elen-coffee' ); ?></p>
				</div>
				<div class="pillar">
					<h3><?php esc_html_e( 'Freshness', 'elen-coffee' ); ?></h3>
					<p><?php esc_html_e( 'Roast-dated bags, shipped within 72 hours of roasting.', 'elen-coffee' ); ?></p>
				</div>
			</div>
		</div>
	</section>

	<?php if ( class_exists( 'WooCommerce' ) ) : ?>
	<section class="section collection-strip" aria-labelledby="collection-heading">
		<div class="container">
			<h2 id="collection-heading" class="section__title reveal" data-reveal><?php esc_html_e( 'Shop by Roast', 'elen-coffee' ); ?></h2>
			<div class="collection-strip__grid reveal-stagger" data-reveal-stagger>
				<?php
				$roast_taxonomy = wc_attribute_taxonomy_name( 'roast' );
				$roast_terms    = taxonomy_exists( $roast_taxonomy ) ? get_terms( array( 'taxonomy' => $roast_taxonomy, 'hide_empty' => false ) ) : array();
				foreach ( $roast_terms as $term ) :
					?>
					<a class="collection-tile" href="<?php echo esc_url( get_term_link( $term ) ); ?>">
						<span class="collection-tile__label"><?php echo esc_html( $term->name ); ?></span>
					</a>
					<?php
				endforeach;
				?>
			</div>
		</div>
	</section>
	<?php endif; ?>

	<section class="section testimonials" aria-labelledby="testimonials-heading">
		<div class="container">
			<h2 id="testimonials-heading" class="sr-only"><?php esc_html_e( 'What people say', 'elen-coffee' ); ?></h2>
			<div class="testimonials__grid reveal-stagger" data-reveal-stagger>
				<blockquote class="testimonial">
					<p>&ldquo;<?php esc_html_e( 'The freshest coffee I have had delivered — you can genuinely taste the roast date.', 'elen-coffee' ); ?>&rdquo;</p>
					<cite>— Sara M.</cite>
				</blockquote>
				<blockquote class="testimonial">
					<p>&ldquo;<?php esc_html_e( 'Packaging feels premium and the flavor notes on the bag are spot on.', 'elen-coffee' ); ?>&rdquo;</p>
					<cite>— Amir R.</cite>
				</blockquote>
				<blockquote class="testimonial">
					<p>&ldquo;<?php esc_html_e( 'Finally a coffee brand that treats sourcing seriously.', 'elen-coffee' ); ?>&rdquo;</p>
					<cite>— Neda K.</cite>
				</blockquote>
			</div>
		</div>
	</section>

	<section class="section cta-banner" aria-labelledby="cta-heading">
		<div class="container cta-banner__inner reveal" data-reveal>
			<h2 id="cta-heading"><?php esc_html_e( 'Ready for your next cup?', 'elen-coffee' ); ?></h2>
			<a class="btn btn--primary btn--lg" href="<?php echo esc_url( $shop_url ); ?>"><?php esc_html_e( 'Shop the collection', 'elen-coffee' ); ?></a>
		</div>
	</section>

</main>

<?php
get_footer();
