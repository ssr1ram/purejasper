Purejasper
===========

A Purejasper is an Html5 notebook with tabs & links.

The documents reside in your private Dropbox folders and comprise of many paragraphs, that the javascript logic in your browser manipulates to provide you rich paragraph navigation and editing.

There is no server manipulation of the data ( *pure* client) and all of these javascript paragraphs ( *jaspers* ) are manipulated in-browser.

The default data file & format

    {"paras":
        [
            {
                "name":"Home",
                "slug":"home",
                "contents":"<h4>This is a Pure Jasper document.</h4> It contains many paragraphs that link to each other, can be navigated in tabs and have a mix of text, links, html, widgets and scripts.<br><br><ul><li>To Edit this para:&nbsp;Click edit on the top right of this message box</li><li>To Create a new para:&nbsp;Type `[[Para Name]] (without the backtick)&nbsp;</li><ul><li>This will create a special link which when clicked will open a new para in a tab</li><li>Something like this:&nbsp;<a class=\"paralink\" href=\"#para/about\" data-para=\"about\" title=\"Link: #para/about\">About</a></li></ul></ul>Click on the FileName to bring up the File Manager, which allows you to create new documents etc.<br>"
            },
            {
                "name":"About",
                "slug":"about",
                "contents":"About this document<br><br>edit me or go back <a class=\"paralink\" href=\"#para/home\" data-para=\"home\">Home</a>&nbsp;"
            }
        ]
    }

As can be seen from the above

    data format: json
    data contents: html

This is a very early alpha version and planned for the future are
- Themes and templates
- Scripts and plugins

There is a Google Group [Purejasper-talk](https://groups.google.com/forum/?fromgroups#!forum/purejasper-talk) where you can ask questions and find out more information.
