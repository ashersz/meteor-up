#!/bin/bash
# allow appUser to run the appName service
sudo -s
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl restart <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl start <%= appName %>.service" >> /etc/sudoers
echo "<%= appUser %> ALL=(root) NOPASSWD: /usr/bin/systemctl stop <%= appName %>.service" >> /etc/sudoers
exit
