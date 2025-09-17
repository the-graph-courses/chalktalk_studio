// Test script for the AI Slide Generator Demo
console.log('Testing AI Slide Generator Demo...');

// Test 1: Check if DOM is ready
function testDOMReady() {
    console.log('✓ Test 1: DOM ready');
    return document.readyState === 'complete';
}

// Test 2: Check external dependencies
function testDependencies() {
    const deps = [
        { name: 'GrapesJS', available: typeof grapesjs !== 'undefined' },
        { name: 'Reveal.js', available: typeof Reveal !== 'undefined' },
        { name: 'PptxGenJS', available: typeof PptxGenJS !== 'undefined' }
    ];

    console.log('✓ Test 2: External dependencies');
    deps.forEach(dep => {
        const status = dep.available ? '✅' : '❌';
        console.log(`  ${status} ${dep.name}: ${dep.available ? 'Available' : 'Missing'}`);
    });

    return deps.every(dep => dep.available);
}

// Test 3: Check if core functions exist
function testCoreFunctions() {
    const functions = [
        'switchTab', 'addSlide', 'removeSlide', 'processSlides',
        'initGrapesJS', 'updateRevealSlides', 'exportToPowerPoint'
    ];

    console.log('✓ Test 3: Core functions');
    functions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function';
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${funcName}: ${exists ? 'Available' : 'Missing'}`);
    });

    return functions.every(funcName => typeof window[funcName] === 'function');
}

// Test 4: Check if elements exist
function testElements() {
    const elements = [
        '#slides-container', '#gjs-editor', '#reveal-container',
        '#reveal-slides', '.tab-btn', '.tab-content'
    ];

    console.log('✓ Test 4: DOM elements');
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        const exists = element !== null;
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${selector}: ${exists ? 'Found' : 'Missing'}`);
    });

    return elements.every(selector => document.querySelector(selector) !== null);
}

// Run all tests
function runTests() {
    console.log('Running comprehensive tests...');

    const results = {
        dom: testDOMReady(),
        dependencies: testDependencies(),
        functions: testCoreFunctions(),
        elements: testElements()
    };

    const allPassed = Object.values(results).every(result => result);

    console.log('\n📊 Test Results:');
    console.log(`DOM Ready: ${results.dom ? '✅' : '❌'}`);
    console.log(`Dependencies: ${results.dependencies ? '✅' : '❌'}`);
    console.log(`Functions: ${results.functions ? '✅' : '❌'}`);
    console.log(`Elements: ${results.elements ? '✅' : '❌'}`);
    console.log(`\nOverall: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);

    return allPassed;
}

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runTests, 2000); // Wait 2 seconds for all scripts to load
    });
} else {
    setTimeout(runTests, 2000);
}

// Export test function for manual use
window.runDemoTests = runTests; 