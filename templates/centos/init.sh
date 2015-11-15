#!/bin/bash
# allow appUser to run the appName service
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl restart <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl start <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl stop <%= appName %>.service" >> /etc/sudoers
