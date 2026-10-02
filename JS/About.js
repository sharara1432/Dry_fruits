document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const aboutHeader = document.getElementById("aboutHeader");
    const aboutMenuButton = document.getElementById("aboutMenuButton");
    const aboutNavigation = document.getElementById("aboutNavigation");

    const currentYear = document.getElementById("currentYear");

    const revealElements = document.querySelectorAll(".reveal");
    const counters = document.querySelectorAll("[data-count]");

    const directionsButton =
        document.querySelector(".directions-button");


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function openMenu() {

        if (!aboutMenuButton || !aboutNavigation) {
            return;
        }

        aboutMenuButton.classList.add("active");

        aboutNavigation.classList.add("show");

        aboutMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );

        aboutMenuButton.setAttribute(
            "aria-label",
            "Close Menu"
        );
    }


    function closeMenu() {

        if (!aboutMenuButton || !aboutNavigation) {
            return;
        }

        aboutMenuButton.classList.remove("active");

        aboutNavigation.classList.remove("show");

        aboutMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        aboutMenuButton.setAttribute(
            "aria-label",
            "Open Menu"
        );
    }


    if (aboutMenuButton && aboutNavigation) {

        aboutMenuButton.addEventListener(
            "click",
            function () {

                const isOpen =
                    aboutNavigation.classList.contains("show");

                if (isOpen) {
                    closeMenu();
                } else {
                    openMenu();
                }

            }
        );
    }


    /* =====================================================
       CLOSE MOBILE MENU WHEN NAV LINK IS CLICKED
    ===================================================== */

    if (aboutNavigation) {

        const navigationLinks =
            aboutNavigation.querySelectorAll("a");

        navigationLinks.forEach(function (link) {

            link.addEventListener(
                "click",
                function () {

                    closeMenu();

                }
            );

        });
    }


    /* =====================================================
       CLOSE MENU WHEN CLICKING OUTSIDE
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            if (!aboutMenuButton || !aboutNavigation) {
                return;
            }

            const clickedInsideMenu =
                aboutNavigation.contains(event.target);

            const clickedButton =
                aboutMenuButton.contains(event.target);

            if (
                !clickedInsideMenu &&
                !clickedButton &&
                aboutNavigation.classList.contains("show")
            ) {

                closeMenu();

            }

        }
    );


    /* =====================================================
       CLOSE MENU WITH ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeMenu();

            }

        }
    );


    /* =====================================================
       CLOSE MENU AFTER RESIZING TO DESKTOP
    ===================================================== */

    window.addEventListener(
        "resize",
        function () {

            if (window.innerWidth > 900) {

                closeMenu();

            }

        }
    );


    /* =====================================================
       STICKY HEADER SCROLL EFFECT
    ===================================================== */

    function updateHeader() {

        if (!aboutHeader) {
            return;
        }

        if (window.scrollY > 20) {

            aboutHeader.classList.add("scrolled");

        } else {

            aboutHeader.classList.remove("scrolled");

        }

    }


    window.addEventListener(
        "scroll",
        updateHeader,
        {
            passive: true
        }
    );


    updateHeader();


    /* =====================================================
       REVEAL ANIMATIONS
    ===================================================== */

    if (
        "IntersectionObserver" in window &&
        revealElements.length > 0
    ) {

        const revealObserver =
            new IntersectionObserver(
                function (entries, observer) {

                    entries.forEach(function (entry) {

                        if (entry.isIntersecting) {

                            entry.target.classList.add("show");

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.15,
                    rootMargin: "0px 0px -50px 0px"
                }
            );


        revealElements.forEach(function (element) {

            revealObserver.observe(element);

        });

    } else {

        revealElements.forEach(function (element) {

            element.classList.add("show");

        });

    }


    /* =====================================================
         Rating animation STATISTICS COUNTER
    ===================================================== */

    function animateCounter(element) {

        if (!element) {
            return;
        }

        if (element.dataset.animated === "true") {
            return;
        }

        element.dataset.animated = "true";

        const target =
            Number(element.getAttribute("data-count"));

        if (isNaN(target)) {
            return;
        }

        const duration = 1800;

        const startTime =
            performance.now();


        function updateCounter(currentTime) {

            const elapsed =
                currentTime - startTime;

            const progress =
                Math.min(
                    elapsed / duration,
                    1
                );


            /* Smooth easing */

            const easedProgress =
                1 - Math.pow(
                    1 - progress,
                    3
                );


            const currentValue =
                Math.floor(
                    easedProgress * target
                );


            element.textContent =
                currentValue;


            if (progress < 1) {

                requestAnimationFrame(
                    updateCounter
                );

            } else {

                element.textContent =
                    target;

            }

        }


        requestAnimationFrame(
            updateCounter
        );

    }


    /* =====================================================
       OBSERVE STATISTICS
    ===================================================== */

    if (
        "IntersectionObserver" in window &&
        counters.length > 0
    ) {

        const counterObserver =
            new IntersectionObserver(
                function (entries, observer) {

                    entries.forEach(function (entry) {

                        if (entry.isIntersecting) {

                            animateCounter(
                                entry.target
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.5
                }
            );


        counters.forEach(function (counter) {

            counterObserver.observe(counter);

        });

    } else {

        counters.forEach(function (counter) {

            const target =
                counter.getAttribute("data-count");

            counter.textContent =
                target;

        });

    }


    /* =====================================================
       GOOGLE MAPS DIRECTIONS
    ===================================================== */

    if (directionsButton) {

        const storeAddress =
            "Jangpura, Bhogal, Church Road, Bhogal Jangpura, New Delhi, Delhi 110014, India";


        directionsButton.addEventListener(
            "click",
            function () {

                const mapsURL =
                    "https://www.google.com/maps/dir/?api=1&destination=" +
                    encodeURIComponent(storeAddress);


                directionsButton.setAttribute(
                    "href",
                    mapsURL
                );

            }
        );

    }


    /* =====================================================
       LOGIN / USER DISPLAY
    ===================================================== */

    const loginButton =
        document.querySelector(".about-login-button");


    if (loginButton) {

        const savedUser =
            localStorage.getItem("sheernUser");


        if (savedUser) {

            try {

                const user =
                    JSON.parse(savedUser);


                const userName =
                    user.name ||
                    user.username ||
                    user.email;


                if (userName) {

                    const loginText =
                        loginButton.querySelector("span");


                    if (loginText) {

                        loginText.textContent =
                            userName;

                    }


                    loginButton.title =
                        "Logged in as " + userName;

                }

            } catch (error) {

                console.warn(
                    "Could not read Sheern user information."
                );

            }

        }

    }


    /* =====================================================
       ACTIVE NAVIGATION LINK
    ===================================================== */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    const navigationLinks =
        document.querySelectorAll(
            ".about-navigation a"
        );


    navigationLinks.forEach(function (link) {

        const linkURL =
            link.getAttribute("href");


        if (!linkURL) {
            return;
        }


        const cleanLink =
            linkURL
                .split("#")[0]
                .split("?")[0]
                .split("/")
                .pop()
                .toLowerCase();


        if (
            cleanLink === currentPage &&
            cleanLink !== ""
        ) {

            navigationLinks.forEach(function (item) {

                item.classList.remove("active");

            });

            link.classList.add("active");

        }

    });


    /* =====================================================
       SMOOTH SCROLL FOR INTERNAL LINKS
    ===================================================== */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(function (link) {

        link.addEventListener(
            "click",
            function (event) {

                const targetID =
                    link.getAttribute("href");


                if (
                    !targetID ||
                    targetID === "#"
                ) {
                    return;
                }


                const targetElement =
                    document.querySelector(
                        targetID
                    );


                if (targetElement) {

                    event.preventDefault();


                    const headerHeight =
                        aboutHeader
                            ? aboutHeader.offsetHeight
                            : 0;


                    const targetPosition =
                        targetElement.getBoundingClientRect().top +
                        window.pageYOffset -
                        headerHeight -
                        15;


                    window.scrollTo({

                        top: targetPosition,

                        behavior: "smooth"

                    });


                    closeMenu();

                }

            }
        );

    });


});