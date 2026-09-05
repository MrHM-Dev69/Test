<?php
/**
 * Template for a Page with the slug "about" — storytelling layout.
 * Falls back to the page's own block-editor content below the fixed
 * intro, so an admin can extend the story without a developer.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$about_image = get_theme_mod( 'elen_about_image' );
?>
<main id="primary" class="site-main about-page">

	<section class="about-hero">
		<div class="about-hero__media reveal" data-reveal>
			<?php if ( $about_image ) : ?>
				<img src="<?php echo esc_url( $about_image ); ?>" alt="" loading="eager" fetchpriority="high">
			<?php elseif ( has_post_thumbnail() ) : ?>
				<?php the_post_thumbnail( 'elen-hero' ); ?>
			<?php endif; ?>
		</div>
		<div class="container">
			<h1 class="about-hero__title reveal" data-reveal><?php echo esc_html( get_theme_mod( 'elen_about_heading', get_the_title() ) ); ?></h1>
			<p class="about-hero__intro reveal" data-reveal><?php echo esc_html( get_theme_mod( 'elen_about_intro' ) ); ?></p>
		</div>
	</section>

	<section class="section about-body container">
		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<div class="editorial-content reveal" data-reveal><?php the_content(); ?></div>
			<?php
		endwhile;
		?>
	</section>

	<section class="section philosophy" aria-labelledby="about-values-heading">
		<div class="container philosophy__inner">
			<h2 id="about-values-heading" class="section__title reveal" data-reveal><?php esc_html_e( 'What we stand for', 'elen-coffee' ); ?></h2>
			<div class="philosophy__pillars reveal-stagger" data-reveal-stagger>
				<div class="pillar">
					<h3><?php esc_html_e( 'Direct Sourcing', 'elen-coffee' ); ?></h3>
					<p><?php esc_html_e( 'We buy from importers and cooperatives we know by name, above fair-trade minimums.', 'elen-coffee' ); ?></p>
				</div>
				<div class="pillar">
					<h3><?php esc_html_e( 'Honest Roasting', 'elen-coffee' ); ?></h3>
					<p><?php esc_html_e( 'Every batch is roasted to reveal the bean, not to hide it behind a house profile.', 'elen-coffee' ); ?></p>
				</div>
				<div class="pillar">
					<h3><?php esc_html_e( 'Real Freshness', 'elen-coffee' ); ?></h3>
					<p><?php esc_html_e( 'Roast dates on every bag. No exceptions, no old stock.', 'elen-coffee' ); ?></p>
				</div>
			</div>
		</div>
	</section>

	<section class="section cta-banner">
		<div class="container cta-banner__inner reveal" data-reveal>
			<h2><?php esc_html_e( 'Taste what we mean.', 'elen-coffee' ); ?></h2>
			<a class="btn btn--primary btn--lg" href="<?php echo esc_url( function_exists( 'wc_get_page_id' ) ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/' ) ); ?>"><?php esc_html_e( 'Shop the collection', 'elen-coffee' ); ?></a>
		</div>
	</section>

</main>
<?php
get_footer();
